import { AutoLoad, Command, Declare, LocalesT, Middlewares, type CommandContext } from 'seyfert';

@Declare({
    name: 'backup',
    description: 'Snapshot and restore this server (channels, roles, bans).',
    defaultMemberPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.backup.name', 'commands.moderation.backup.description')

@Middlewares(['isOwner'])

@AutoLoad()

/**
 * Parent command for the `backup` subcommands (`create`, `info`, `load`, `delete`), auto-loaded
 * from this folder via `@AutoLoad()`. Owner-only (`isOwner` middleware), requires Administrator.
 */
export default class BackupCommand extends Command {
    /** Usage fallback shown when the command is invoked without a subcommand. */
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.moderation.backup.usage.get() });
    }
}
