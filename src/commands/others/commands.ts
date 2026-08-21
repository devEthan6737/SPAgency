import { Command, Declare, Embed, EmbedColors, LocalesT, type CommandContext } from 'seyfert';

@Declare({
    name: 'comandos',
    description: "Obtén todos los comandos del bot.",
    aliases: ['cmds', 'commands'],
    props: { category: 'others' }
})

@LocalesT('commands.others.commands.name', 'commands.others.commands.description')

export default class CommandsCommand extends Command {
    async run(ctx: CommandContext) {
        const t = ctx.t.commands.others.commands;

        const byCategory = new Map<string, string[]>();
        for (const command of ctx.client.commands.values) {
            if (!(command instanceof Command) || !command.props?.category) continue;
            const names = byCategory.get(command.props.category) ?? [];
            names.push(command.name);
            byCategory.set(command.props.category, names);
        }

        const embed = new Embed().setColor(EmbedColors.Blue).setDescription(t.intro.get());

        for (const [category, label] of Object.entries(t.categories.get())) {
            const names = byCategory.get(category);
            if (!names?.length) continue;
            embed.addFields({ name: label, value: names.map((name) => `\`${name}\``).join(', ') });
        }

        await ctx.write({ embeds: [embed] });
    }
}
