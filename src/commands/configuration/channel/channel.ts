import { AutoLoad, Command, Declare, LocalesT, type CommandContext } from 'seyfert';

@Declare({
    name: 'channel',
    description: 'Manage your server channels.',
    props: { category: 'configuration' }
})

@LocalesT('commands.configuration.channel.name', 'commands.configuration.channel.description')

@AutoLoad()

export default class ChannelCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.configuration.channel.usage.get() });
    }
}
