import {
    type AutocompleteInteraction,
    Button,
    ButtonStyle,
    Command,
    Container,
    type ContextMenuCommand,
    createStringOption,
    Declare,
    EmbedColors,
    LocalesT,
    MessageFlags,
    Options,
    Separator,
    SubCommand,
    TextDisplay,
    type CommandContext,
    type SeyfertChoice,
    type SeyfertLocale
} from 'seyfert';
import { CommandLocalizer } from '../../systems/commands/CommandLocalizer.js';
import { Emojis, EmojiKey } from '../../systems/emojis/index.js';
import { Paginator } from '../../systems/shared/pagination/index.js';

/** Locale accessor for this command's strings. */
type CommandsLocale = SeyfertLocale['commands']['others']['commands'];

/** How many commands go on one page of the list. Keeps a page well under Discord's 4000 characters of text per message. */
const CommandsPerPage = 10;

/** The star that marks each category. A category that isn't here gets the black one. */
const CategoryEmojis: Readonly<Record<string, EmojiKey>> = {
    configuration: EmojiKey.StarBlue,
    moderation: EmojiKey.StarRed,
    others: EmojiKey.StarYellow
};

/** One command as the list shows it. */
interface CommandEntry {
    name: string;
    description: string;
    subcommands: string[];
}

/** One page of the list: a slice of one category. */
interface CommandsPage {
    category: string;
    /** Which slice of the category this is, starting at 1, and how many there are. */
    part: number;
    parts: number;
    entries: CommandEntry[];
}

const options = {
    command: createStringOption({
        description: 'Name of the command to look up.',
        required: false,
        locales: {
            name: 'commands.others.commands.option.name',
            description: 'commands.others.commands.option.description'
        },
        autocomplete: async (interaction: AutocompleteInteraction<boolean, string>) => {
            const input = interaction.getInput().toLowerCase();
            const choices: SeyfertChoice<string>[] = interaction.client.commands.values
                .filter(CommandsCommand.isCommand)
                .filter((command: Command) => command.name.toLowerCase().includes(input))
                .slice(0, 25)
                .map((command: Command) => ({ name: command.name, value: command.name }));
            await interaction.respond(choices);
        }
    })
};

@Declare({
    name: 'commands',
    description: "Get all the bot's commands.",
    aliases: ['cmds', 'comandos'],
    props: { category: 'others' }
})
@LocalesT('commands.others.commands.name', 'commands.others.commands.description')
@Options(options)
/**
 * Lists every registered command, one page per category, or shows one command's usage by name (with
 * autocomplete). Both are Components V2 cards, in the language of whoever asks. Read-only, no side effects.
 */
export default class CommandsCommand extends Command {
    /** Type guard filtering out context-menu commands, which don't expose the fields this command displays. */
    static isCommand(value: Command | ContextMenuCommand): value is Command {
        return value instanceof Command;
    }

    /** Shows a single command's usage if `command` was given, otherwise the paged list. */
    async run(ctx: CommandContext<typeof options>) {
        const commandName = ctx.options.command;

        if (commandName) {
            await this.showUsage(ctx, commandName);
        } else {
            await this.showList(ctx);
        }
    }

    /**
     * Replies with the usage card of a single command, or a not-found message.
     * @param ctx The command context.
     * @param commandName What was typed: the command's name in any language.
     */
    private async showUsage(ctx: CommandContext<typeof options>, commandName: string) {
        const t = ctx.t.commands.others.commands;
        const command = ctx.client.commands.values.filter(CommandsCommand.isCommand).find((value: Command) => CommandLocalizer.matches(value, commandName));

        if (!command) {
            await ctx.write({ content: t.notFound(commandName).get() });
            return;
        }

        await ctx.write({ components: [this.buildUsage(command, t, CommandLocalizer.locale(ctx))], flags: MessageFlags.IsComponentsV2 });
    }

    /**
     * The card for one command: its name and description, its category and aliases in small text, then its options and subcommands.
     * @param command The command.
     * @param t The command's strings.
     * @param locale The Discord locale to read names and descriptions in.
     * @returns The card.
     */
    private buildUsage(command: Command, t: CommandsLocale, locale: string): Container {
        const options = (command.options ?? []).filter((option) => !(option instanceof SubCommand));
        const subcommands = (command.options ?? []).filter((option) => option instanceof SubCommand);
        const categories: Record<string, string> = t.categories.get();
        const category = command.props?.category as string | undefined;

        const details = [
            category ? `${Emojis.get(this.categoryEmoji(category))} ${categories[category] ?? category}` : undefined,
            command.aliases?.length ? `${t.usage.aliases.get()}: ${command.aliases.map((alias) => `\`${alias}\``).join(' · ')}` : undefined
        ].filter(Boolean);

        const card = new Container()
            .setColor(EmbedColors.Blue)
            .addComponents(new TextDisplay().setContent(`## /${CommandLocalizer.name(command, locale)}\n${CommandLocalizer.description(command, locale)}${details.length ? `\n-# ${details.join(' · ')}` : ''}`), new Separator());

        const optionLines = options.map((option) => {
            const required = 'required' in option && option.required ? ` (${t.usage.required.get()})` : '';

            return `\`${CommandLocalizer.name(option, locale)}\`${required}: ${CommandLocalizer.description(option, locale)}`;
        });
        card.addComponents(new TextDisplay().setContent(`### ${t.usage.options.get()}\n${optionLines.length ? optionLines.join('\n') : t.usage.noOptions.get()}`));

        if (subcommands.length) {
            const lines = subcommands.map((subcommand) => `\`${CommandLocalizer.name(subcommand, locale)}\`: ${CommandLocalizer.description(subcommand, locale)}`);
            card.addComponents(new Separator(), new TextDisplay().setContent(`### ${t.usage.subcommands.get()}\n${lines.join('\n')}`));
        }

        return card;
    }

    /**
     * Replies with every command, a page per category (or per slice of a big one).
     * @param ctx The command context.
     */
    private async showList(ctx: CommandContext<typeof options>) {
        const t = ctx.t.commands.others.commands;
        const locale = CommandLocalizer.locale(ctx);
        const categories: Record<string, string> = t.categories.get();
        const pages = this.buildPages(ctx, categories, locale);

        await new Paginator(ctx, {
            data: pages,
            itemsPerPage: 1,
            content: ([page]) => this.buildPage(page, t, categories),
            middle: (view) =>
                new Button()
                    .setCustomId('commands:page')
                    .setLabel(`${view.page}/${view.totalPages} · ${categories[pages[view.page - 1].category] ?? pages[view.page - 1].category}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
        }).start();
    }

    /**
     * Groups the commands by category, in the order the locale lists the categories, and cuts big
     * categories into slices of {@link CommandsPerPage}. Commands are sorted by their name in the asker's language.
     * @param ctx The command context.
     * @param categories The category labels, from the locale; their keys give the order.
     * @param locale The Discord locale to read names and descriptions in.
     * @returns The pages of the list; categories with no commands have none.
     */
    private buildPages(ctx: CommandContext<typeof options>, categories: Record<string, string>, locale: string): CommandsPage[] {
        const byCategory = new Map<string, CommandEntry[]>();
        for (const command of ctx.client.commands.values.filter(CommandsCommand.isCommand)) {
            const category = command.props?.category as string | undefined;
            if (!category) continue;

            const entry: CommandEntry = {
                name: CommandLocalizer.name(command, locale),
                description: CommandLocalizer.description(command, locale),
                subcommands: (command.options ?? []).filter((option) => option instanceof SubCommand).map((subcommand) => CommandLocalizer.name(subcommand, locale))
            };
            byCategory.set(category, [...(byCategory.get(category) ?? []), entry]);
        }

        const order = [...Object.keys(categories), ...[...byCategory.keys()].filter((category) => !(category in categories))];

        return order.flatMap((category) => {
            const entries = (byCategory.get(category) ?? []).sort((a, b) => a.name.localeCompare(b.name));
            const parts = Math.ceil(entries.length / CommandsPerPage);

            return Array.from({ length: parts }, (_, index) => ({
                category,
                part: index + 1,
                parts,
                entries: entries.slice(index * CommandsPerPage, (index + 1) * CommandsPerPage)
            }));
        });
    }

    /**
     * One page of the list: the category as a heading, its commands with their descriptions, and a hint.
     * @param page The slice to draw.
     * @param t The command's strings.
     * @param categories The category labels.
     * @returns The page's card.
     */
    private buildPage(page: CommandsPage, t: CommandsLocale, categories: Record<string, string>): Container {
        const part = page.parts > 1 ? ` (${page.part}/${page.parts})` : '';
        const heading = `## ${Emojis.get(this.categoryEmoji(page.category))} **::** ${categories[page.category] ?? page.category}${part}`;
        const lines = page.entries.map(({ name, description, subcommands }) => {
            const subs = subcommands.length ? `\n-# ${subcommands.join(' · ')}` : '';

            return `${Emojis.get(EmojiKey.Arrow)} **::** \`/${name}\` · ${description}${subs}`;
        });

        return new Container()
            .setColor(EmbedColors.Blue)
            .addComponents(
                new TextDisplay().setContent(`${heading}\n-# ${t.intro.get()}`),
                new Separator(),
                new TextDisplay().setContent(lines.join('\n')),
                new Separator(),
                new TextDisplay().setContent(`-# ${t.hint.get()}`)
            );
    }

    /**
     * @param category A category key.
     * @returns Its star.
     */
    private categoryEmoji(category: string): EmojiKey {
        return CategoryEmojis[category] ?? EmojiKey.StarBlack;
    }
}
