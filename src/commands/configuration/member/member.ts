import { AutoLoad, Command, Declare, LocalesT, type CommandContext } from 'seyfert';

/**
 * Parent command for member-management subcommands (`info`, `add-role`, `remove-role`, `set-nickname`).
 * Has no logic of its own beyond showing usage when invoked without a subcommand.
 */
@Declare({
    name: 'member',
    description: 'Manage your server members.',
    aliases: ['user'],
    props: { category: 'configuration' }
})

@LocalesT('commands.configuration.member.name', 'commands.configuration.member.description')

@AutoLoad()

export default class MemberCommand extends Command {
    /** Replies with the command's usage text; the actual work happens in its subcommands. */
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.configuration.member.usage.get() });
    }
}
