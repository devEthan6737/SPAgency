import { AutoLoad, Command, Declare, LocalesT, type CommandContext } from 'seyfert';

@Declare({
    name: 'guild',
    description: 'Manage your server.',
    props: { category: 'configuration' }
})

@LocalesT('commands.configuration.guild.name', 'commands.configuration.guild.description')

@AutoLoad()

export default class GuildCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.configuration.guild.usage.get() });
    }
}
