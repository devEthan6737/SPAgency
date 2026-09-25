import { ActionRow, Button, ButtonStyle, TextDisplay, type CommandContext, type ComponentInteraction, type Container, type Embed, MessageFlags } from 'seyfert';
import { PageCursor, type PageView } from './PageCursor.js';
import { PaginationButtonId } from './PaginationButtonId.js';
import { DefaultPaginationTimeoutMs, type PaginationBody, type PaginationSession } from './PaginationSession.js';

/** What both ways of drawing a {@link Paginator} take. */
interface PaginatorBaseOptions<T> {
    /** Everything to page through. */
    data: readonly T[];
    itemsPerPage: number;
    /** An extra button between "previous" and "next", or a function building one for the current page. Handle its clicks with {@link Paginator.run}; a disabled one just labels the page. */
    middle?: Button | ((view: PageView) => Button);
    /** Milliseconds of life before the buttons are disabled. Default 3 minutes. */
    timeoutMs?: number;
}

/** A paginator drawn as an embed: the items of a page become its description. */
export interface EmbedPaginatorOptions<T> extends PaginatorBaseOptions<T> {
    /** Turns the items of one page into the embed description; must stay under Discord's 4096 characters. Never called for an empty list. */
    formatter: (items: readonly T[], view: PageView) => string;
    /** The embed around the description: title, color, footer. Its description is filled in by the paginator. */
    embed: (view: PageView) => Embed;
}

/**
 * A paginator drawn with Components V2: each page is a container you build. With one item per page,
 * every entry of `data` is a page of its own, which is how a card with several sections is paged.
 * The message is sent as a Components V2 one, so it can carry no embed and no plain `content`.
 */
export interface ComponentsPaginatorOptions<T> extends PaginatorBaseOptions<T> {
    /** Builds the container of one page from its items. The paginator adds the navigation row under it. Never called for an empty list. */
    content: (items: readonly T[], view: PageView) => Container;
}

/** Options of a {@link Paginator}: an embed one or a Components V2 one. */
export type PaginatorOptions<T> = EmbedPaginatorOptions<T> | ComponentsPaginatorOptions<T>;

/** What {@link Paginator} needs to know about another paginator it is nested with, whatever type of data it pages. */
interface PaginatorNode {
    readonly cursor: PageCursor;
    parent?: PaginatorNode;
    child?: PaginatorNode;
    render(disabled: boolean): PaginationBody;
}

/**
 * Pages an embed, or a Components V2 container, through a list with previous and next buttons, only for
 * the user who ran the command.
 *
 * It can also nest: a click on its middle button can call {@link Paginator.openChild} to replace the
 * page with another paginator (say, the detail of an item) on the same message, with a "back" button
 * that returns to this one. Previous and next always act on the paginator currently showing.
 * @typeParam T The type of the items being paged.
 */
export class Paginator<T> implements PaginatorNode {
    readonly cursor: PageCursor;
    parent?: PaginatorNode;
    child?: PaginatorNode;
    private session?: PaginationSession;

    /**
     * @param ctx The command context: the paginator is sent as its reply, and only `ctx.author` may click.
     * @param options See {@link PaginatorOptions}.
     */
    constructor(
        private readonly ctx: CommandContext,
        private readonly options: PaginatorOptions<T>
    ) {
        this.cursor = new PageCursor(options.data.length, options.itemsPerPage);
    }

    /** The items on the page being shown. */
    get currentItems(): T[] {
        return this.cursor.slice(this.options.data);
    }

    /**
     * Sends the first page and starts listening to its buttons. Call once, on the top-level paginator.
     * @returns Resolves once the message is sent.
     */
    async start(): Promise<void> {
        const message = await this.ctx.write(this.render(false), true);
        const collector = message.createComponentCollector({
            filter: (interaction) => interaction.user.id === this.ctx.author.id,
            timeout: this.options.timeoutMs ?? DefaultPaginationTimeoutMs,
            onStop: () => this.expire()
        });
        this.session = { message, collector };

        collector.run<ComponentInteraction>(PaginationButtonId.Next, (interaction) => this.turn(interaction, (node) => node.cursor.next()));
        collector.run<ComponentInteraction>(PaginationButtonId.Previous, (interaction) => this.turn(interaction, (node) => node.cursor.previous()));
        collector.run<ComponentInteraction>(PaginationButtonId.Back, (interaction) => this.goBack(interaction));
    }

    /**
     * Listens to a button of your own, such as the middle one. Only the invoker's clicks arrive.
     * @param customId The id of the button.
     * @param callback Called on each click; it must answer the interaction.
     * @throws {Error} If called before {@link Paginator.start} (or {@link Paginator.openChild}).
     */
    run(customId: string, callback: (interaction: ComponentInteraction) => Promise<void>): void {
        this.activeSession().collector.run<ComponentInteraction>(customId, (interaction) => callback(interaction));
    }

    /**
     * Replaces this paginator on screen with another one, on the same message.
     * @param interaction The click that asked for it; it is answered by this call.
     * @param options The child paginator's options.
     * @returns The child, to attach its own buttons with {@link Paginator.run}.
     */
    async openChild<U>(interaction: ComponentInteraction, options: PaginatorOptions<U>): Promise<Paginator<U>> {
        const child = new Paginator<U>(this.ctx, options);
        child.parent = this;
        child.session = this.activeSession();
        this.child = child;
        await interaction.update(child.render(false));

        return child;
    }

    /**
     * @param disabled Whether every button is switched off, as after the paginator expires.
     * @returns The message body for the page being shown.
     */
    render(disabled: boolean): PaginationBody {
        const view = this.cursor.view;
        const items = this.currentItems;
        const { empty, back } = this.ctx.t.systems.pagination;

        const controls = [
            new Button().setCustomId(PaginationButtonId.Previous).setLabel('↢').setStyle(ButtonStyle.Primary).setDisabled(disabled || !this.cursor.hasPrevious),
            ...this.middleButton(view, disabled),
            new Button().setCustomId(PaginationButtonId.Next).setLabel('↣').setStyle(ButtonStyle.Primary).setDisabled(disabled || !this.cursor.hasNext)
        ];
        const rows = [new ActionRow<Button>().addComponents(controls)];
        if (this.parent) {
            const button = new Button().setCustomId(PaginationButtonId.Back).setLabel(back.get()).setStyle(ButtonStyle.Secondary).setDisabled(disabled);
            rows.push(new ActionRow<Button>().addComponents(button));
        }

        if ('content' in this.options) {
            if (!items.length) return { components: [new TextDisplay().setContent(empty.get()), ...rows], flags: MessageFlags.IsComponentsV2 };

            return { components: [this.options.content(items, view), ...rows], flags: MessageFlags.IsComponentsV2 };
        }

        const description = items.length ? this.options.formatter(items, view) : empty.get();

        return { embeds: [this.options.embed(view).setDescription(description)], components: rows };
    }

    /**
     * @param view The page being shown.
     * @param disabled Whether the paginator has expired, which switches the button off even if it was already.
     * @returns The middle button as a one-element list, or an empty one if there is none.
     */
    private middleButton(view: PageView, disabled: boolean): Button[] {
        const { middle } = this.options;
        if (!middle) return [];

        const button = typeof middle === 'function' ? middle(view) : middle;

        return [disabled ? button.setDisabled(true) : button];
    }

    /** @returns The paginator currently on screen: this one, or the deepest child opened from it. */
    private leaf(): PaginatorNode {
        let node: PaginatorNode = this;
        while (node.child) node = node.child;

        return node;
    }

    /**
     * @returns The session, shared by every level.
     * @throws {Error} If nothing has been sent yet.
     */
    private activeSession(): PaginationSession {
        if (!this.session) throw new Error('The paginator has not been started');

        return this.session;
    }

    /**
     * Moves the paginator on screen and redraws it; if it could not move (a click that raced the
     * button being disabled), just acknowledges the click.
     * @param interaction The click.
     * @param move Moves the cursor of the paginator on screen, saying whether it did.
     */
    private async turn(interaction: ComponentInteraction, move: (node: PaginatorNode) => boolean): Promise<void> {
        const node = this.leaf();
        if (!move(node)) return void (await interaction.deferUpdate());

        await interaction.update(node.render(false));
    }

    /**
     * Returns from a child to the paginator that opened it.
     * @param interaction The click on "back".
     */
    private async goBack(interaction: ComponentInteraction): Promise<void> {
        const parent = this.leaf().parent;
        if (!parent) return void (await interaction.deferUpdate());

        parent.child = undefined;
        await interaction.update(parent.render(false));
    }

    /** Disables the buttons of the page on screen once the collector times out. A message deleted meanwhile is not an error. */
    private async expire(): Promise<void> {
        const message = this.session?.message;
        if (!message) return;

        const { components, flags } = this.leaf().render(true);
        await message.edit({ components, ...(flags ? { flags } : {}) }).catch(() => undefined);
    }
}
