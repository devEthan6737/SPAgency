import { AutoLoad, Command, Declare, LocalesT, type CommandContext } from 'seyfert';

/**
 * Parent command for channel-management subcommands (`create`, `delete`).
 * Has no logic of its own beyond showing usage when invoked without a subcommand.
 */
@Declare({
    name: 'channel',
    description: 'Manage your server channels.',
    props: { category: 'configuration' }
})

@LocalesT('commands.configuration.channel.name', 'commands.configuration.channel.description')

@AutoLoad()

export default class ChannelCommand extends Command {
    /** Replies with the command's usage text; the actual work happens in its subcommands. */
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.configuration.channel.usage.get() });
    }
}
