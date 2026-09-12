import { AutoLoad, Command, Declare, LocalesT, type CommandContext } from 'seyfert';

/**
 * Parent command for guild-management subcommands (`info`, `set-name`, `set-icon`, `create-invite`).
 * Has no logic of its own beyond showing usage when invoked without a subcommand.
 */
@Declare({
    name: 'guild',
    description: 'Manage your server.',
    props: { category: 'configuration' }
})

@LocalesT('commands.configuration.guild.name', 'commands.configuration.guild.description')

@AutoLoad()

export default class GuildCommand extends Command {
    /** Replies with the command's usage text; the actual work happens in its subcommands. */
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.configuration.guild.usage.get() });
    }
}
