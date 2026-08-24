import {
    type AutocompleteInteraction,
    Command,
    type ContextMenuCommand,
    createStringOption,
    Declare,
    Embed,
    EmbedColors,
    LocalesT,
    Options,
    type SeyfertChoice,
    type SeyfertLocale,
    SubCommand,
    type CommandContext
} from 'seyfert';

type CommandsLocale = SeyfertLocale['commands']['others']['commands'];

interface CommandOptionInfo {
    name: string;
    description: string;
    required?: boolean;
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
export default class CommandsCommand extends Command {
    static isCommand(value: Command | ContextMenuCommand): value is Command {
        return value instanceof Command;
    }

    private isCommandOption(value: SubCommand | CommandOptionInfo): value is CommandOptionInfo {
        return !(value instanceof SubCommand);
    }

    async run(ctx: CommandContext<typeof options>) {
        const commandName = ctx.options.command;

        if (commandName) {
            await this.showUsage(ctx, commandName);
        } else {
            await this.showList(ctx);
        }
    }

    /** Replies with the description and options of a single command, or a not-found message. */
    private async showUsage(ctx: CommandContext<typeof options>, commandName: string) {
        const t = ctx.t.commands.others.commands;
        const command = ctx.client.commands.values.filter(CommandsCommand.isCommand).find((value: Command) => value.name === commandName);

        if (!command) {
            await ctx.write({ content: t.notFound(commandName).get() });
            return;
        }

        await ctx.write({ embeds: [this.buildUsageEmbed(command, t)] });
    }

    private buildUsageEmbed(command: Command, t: CommandsLocale) {
        const commandOptions = (command.options ?? []).filter((option) => this.isCommandOption(option));

        return new Embed()
            .setColor(EmbedColors.Blue)
            .setTitle(`/${command.name}`)
            .setDescription(command.description)
            .addFields({
                name: t.usage.options.get(),
                value: commandOptions.length ? commandOptions.map((option) => this.formatOption(option, t)).join('\n') : t.usage.noOptions.get()
            });
    }

    private formatOption(option: CommandOptionInfo, t: CommandsLocale) {
        const required = option.required ? ` (${t.usage.required.get()})` : '';
        return `\`${option.name}\` — ${option.description}${required}`;
    }

    /** Replies with every command grouped by category. */
    private async showList(ctx: CommandContext<typeof options>) {
        const t = ctx.t.commands.others.commands;
        await ctx.write({ embeds: [this.buildListEmbed(ctx, t)] });
    }

    private buildListEmbed(ctx: CommandContext<typeof options>, t: CommandsLocale) {
        const byCategory = this.groupByCategory(ctx);

        const embed = new Embed().setColor(EmbedColors.Blue).setDescription(t.intro.get());
        for (const [category, label] of Object.entries(t.categories.get())) {
            const names = byCategory.get(category);
            if (!names?.length) continue;
            embed.addFields({ name: label, value: names.map((name) => `\`${name}\``).join(', ') });
        }

        return embed;
    }

    private groupByCategory(ctx: CommandContext<typeof options>) {
        const byCategory = new Map<string, string[]>();
        for (const command of ctx.client.commands.values.filter(CommandsCommand.isCommand)) {
            if (!command.props?.category) continue;
            const names = byCategory.get(command.props.category) ?? [];
            names.push(command.name);
            byCategory.set(command.props.category, names);
        }
        return byCategory;
    }
}
