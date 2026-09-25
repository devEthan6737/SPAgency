import { ActionRow, Button, ButtonStyle, type CommandContext, type ComponentInteraction, type Embed } from 'seyfert';
import { PageCursor, type PageView } from './PageCursor.js';
import { PaginationButtonId } from './PaginationButtonId.js';
import { DefaultPaginationTimeoutMs, type PaginationBody, type PaginationSession } from './PaginationSession.js';

/** What a page of a {@link PaginationSelector} knows about itself and about the selected row. */
export interface SelectorView extends PageView {
    /** The index in the whole (filtered) list of the selected item, or -1 if none is selected yet. */
    selectedIndex: number;
    /** The index in the whole list of the first item on this page: the item at position `i` of the page is `firstIndex + i`. */
    firstIndex: number;
}

/**
 * The four buttons of the caller, in reading order across the grid: right of "up", middle of the
 * page row, left of "down" and right of "down". A `null` slot shows a disabled placeholder.
 */
export type SelectorActions = readonly [Button | null, Button | null, Button | null, Button | null];

/** Options of a {@link PaginationSelector}. */
export interface PaginationSelectorOptions<T> {
    data: readonly T[];
    itemsPerPage: number;
    /** Turns the items of one page into the embed description, marking the selected one; under 4096 characters. Never called for an empty list. */
    formatter: (items: readonly T[], view: SelectorView) => string;
    /** The embed around the description. Its description is filled in by the selector. */
    embed: (view: SelectorView) => Embed;
    /** Keeps only the items it returns `true` for. */
    filter?: (item: T) => boolean;
    /** The text behind the "?" button: how to use this list. */
    information: string;
    /** The caller's own buttons; they are disabled while nothing is selected. Handle their clicks with {@link PaginationSelector.addAction}. */
    actions?: SelectorActions;
    /** Milliseconds of life before the buttons are disabled. Default 3 minutes. */
    timeoutMs?: number;
}

/** The unicode of a slot nobody filled. */
const PlaceholderEmoji = '⚫';

/**
 * A list you move a selection through: up and down arrows select a row (turning pages as the
 * selection crosses a page edge), left and right turn pages, and up to four buttons of the caller act
 * on the selected item. A "?" button shows how to use it. Only the invoker can press anything.
 * @typeParam T The type of the items in the list.
 */
export class PaginationSelector<T> {
    private readonly cursor: PageCursor;
    private items: readonly T[];
    private selectedIndex = -1;
    private session?: PaginationSession;

    /**
     * @param ctx The command context: the selector is sent as its reply, and only `ctx.author` may press its buttons.
     * @param options See {@link PaginationSelectorOptions}.
     */
    constructor(
        private readonly ctx: CommandContext,
        private readonly options: PaginationSelectorOptions<T>
    ) {
        this.items = PaginationSelector.filtered(options.data, options.filter);
        this.cursor = new PageCursor(this.items.length, options.itemsPerPage);
    }

    /**
     * @param data The list to filter.
     * @param filter The predicate, if any.
     * @returns `data` without the items the filter rejects.
     */
    private static filtered<T>(data: readonly T[], filter?: (item: T) => boolean): readonly T[] {
        return filter ? data.filter(filter) : data;
    }

    /** @returns The selected item, or `undefined` if none is selected. */
    getSelectedItem(): T | undefined {
        return this.items[this.selectedIndex];
    }

    /**
     * Selects an item and shows the page it is on. Takes effect on the next redraw.
     * @param index The index in the (filtered) list; clamped into it.
     */
    select(index: number): void {
        this.selectedIndex = Math.min(Math.max(index, -1), this.items.length - 1);
        if (this.selectedIndex >= 0) this.cursor.goTo(this.cursor.pageOf(this.selectedIndex));
    }

    /**
     * Sends the first page and starts listening to its buttons.
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

        collector.run<ComponentInteraction>(PaginationButtonId.Information, (interaction) => this.showInformation(interaction));
        collector.run<ComponentInteraction>(PaginationButtonId.Back, (interaction) => this.redraw(interaction));
        collector.run<ComponentInteraction>(PaginationButtonId.Previous, (interaction) => this.move(interaction, () => this.previousPage()));
        collector.run<ComponentInteraction>(PaginationButtonId.Next, (interaction) => this.move(interaction, () => this.nextPage()));
        collector.run<ComponentInteraction>(PaginationButtonId.Up, (interaction) => this.move(interaction, () => this.step(-1)));
        collector.run<ComponentInteraction>(PaginationButtonId.Down, (interaction) => this.move(interaction, () => this.step(1)));
    }

    /**
     * Listens to one of your own buttons. After `callback` runs, the selector redraws itself, so a
     * callback that changes the data only needs to call {@link PaginationSelector.refreshData}.
     * @param customId The id of the button.
     * @param callback Called on each click with the selected item. It may answer the interaction itself (open a modal, say); if it doesn't, the redraw does.
     * @throws {Error} If called before {@link PaginationSelector.start}.
     */
    addAction(customId: string, callback: (interaction: ComponentInteraction, item: T | undefined) => Promise<void>): void {
        this.activeSession().collector.run<ComponentInteraction>(customId, async (interaction) => {
            await callback(interaction, this.getSelectedItem());
            await this.redraw(interaction);
        });
    }

    /**
     * Swaps the list for a new one, keeping the page and the selection valid. If nothing was selected
     * and there is now something to select, the first item is.
     * @param data The new list; the original filter is applied to it.
     */
    refreshData(data: readonly T[]): void {
        this.items = PaginationSelector.filtered(data, this.options.filter);
        this.cursor.resize(this.items.length);

        this.selectedIndex = Math.min(this.selectedIndex, this.items.length - 1);
        if (this.selectedIndex < 0 && this.items.length > 0) this.selectedIndex = 0;
        if (this.selectedIndex >= 0) this.cursor.goTo(this.cursor.pageOf(this.selectedIndex));
    }

    /**
     * @param disabled Whether every button is switched off, as after the selector expires.
     * @returns The message body for the current page.
     */
    private render(disabled: boolean): PaginationBody {
        const view = this.view;
        const pageItems = this.cursor.slice(this.items);
        const description = pageItems.length ? this.options.formatter(pageItems, view) : this.ctx.t.systems.pagination.empty.get();

        return { embeds: [this.options.embed(view).setDescription(description)], components: this.rows(disabled) };
    }

    /** @returns The page and the selection, described for the callers' formatter and embed. */
    private get view(): SelectorView {
        return { ...this.cursor.view, selectedIndex: this.selectedIndex, firstIndex: this.cursor.firstIndex };
    }

    /**
     * @param disabled Whether every button is switched off.
     * @returns The 3x3 grid of controls.
     */
    private rows(disabled: boolean): ActionRow<Button>[] {
        const nothingSelected = this.selectedIndex === -1;
        const slot = (index: 0 | 1 | 2 | 3, empty: PaginationButtonId): Button => {
            const action = this.options.actions?.[index];

            return action
                ? action.setDisabled(disabled || nothingSelected)
                : new Button().setCustomId(empty).setEmoji(PlaceholderEmoji).setStyle(ButtonStyle.Secondary).setDisabled(true);
        };
        const arrow = (id: PaginationButtonId, label: string, enabled: boolean): Button =>
            new Button().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Primary).setDisabled(disabled || !enabled);

        return [
            new ActionRow<Button>().addComponents(
                new Button().setCustomId(PaginationButtonId.Information).setEmoji('❓').setStyle(ButtonStyle.Danger).setDisabled(disabled),
                arrow(PaginationButtonId.Up, '▲', this.selectedIndex > 0),
                slot(0, PaginationButtonId.Empty1)
            ),
            new ActionRow<Button>().addComponents(
                arrow(PaginationButtonId.Previous, '◀', this.cursor.hasPrevious),
                slot(1, PaginationButtonId.Empty2),
                arrow(PaginationButtonId.Next, '▶', this.cursor.hasNext)
            ),
            new ActionRow<Button>().addComponents(
                slot(2, PaginationButtonId.Empty3),
                arrow(PaginationButtonId.Down, '▼', this.selectedIndex < this.items.length - 1),
                slot(3, PaginationButtonId.Empty4)
            )
        ];
    }

    /** Selects the last item of the previous page. @returns Whether it moved. */
    private previousPage(): boolean {
        if (!this.cursor.previous()) return false;
        this.selectedIndex = Math.min(this.cursor.firstIndex + this.cursor.pageSize - 1, this.items.length - 1);

        return true;
    }

    /** Selects the first item of the next page. @returns Whether it moved. */
    private nextPage(): boolean {
        if (!this.cursor.next()) return false;
        this.selectedIndex = this.cursor.firstIndex;

        return true;
    }

    /**
     * Moves the selection by one row, turning the page if it crosses an edge.
     * @param direction -1 for up, 1 for down.
     * @returns Whether it moved.
     */
    private step(direction: -1 | 1): boolean {
        const target = this.selectedIndex + direction;
        if (target < 0 || target >= this.items.length) return false;

        this.selectedIndex = target;
        this.cursor.goTo(this.cursor.pageOf(target));

        return true;
    }

    /**
     * Applies a move and redraws; if nothing moved (a click that raced the button being disabled), just acknowledges it.
     * @param interaction The click.
     * @param move Changes the selection or the page, saying whether it did.
     */
    private async move(interaction: ComponentInteraction, move: () => boolean): Promise<void> {
        if (!move()) return void (await interaction.deferUpdate());

        await this.redraw(interaction);
    }

    /**
     * Shows the current page, answering the interaction with an update, or by editing the message if a callback already answered it.
     * @param interaction The click that caused the redraw.
     */
    private async redraw(interaction: ComponentInteraction): Promise<void> {
        const body = this.render(false);
        if (interaction.replied) await this.activeSession().message.edit(body);
        else await interaction.update(body);
    }

    /**
     * Replaces the page with the usage text and a single "back" button.
     * @param interaction The click on "?".
     */
    private async showInformation(interaction: ComponentInteraction): Promise<void> {
        const back = new Button().setCustomId(PaginationButtonId.Back).setLabel(this.ctx.t.systems.pagination.back.get()).setStyle(ButtonStyle.Secondary);

        await interaction.update({
            embeds: [this.options.embed(this.view).setDescription(this.options.information)],
            components: [new ActionRow<Button>().addComponents(back)]
        });
    }

    /** @returns The session. @throws {Error} If nothing has been sent yet. */
    private activeSession(): PaginationSession {
        if (!this.session) throw new Error('The selector has not been started');

        return this.session;
    }

    /** Disables every button once the collector times out. A message deleted meanwhile is not an error. */
    private async expire(): Promise<void> {
        const message = this.session?.message;
        if (!message) return;

        await message.edit({ components: this.rows(true) }).catch(() => undefined);
    }
}
