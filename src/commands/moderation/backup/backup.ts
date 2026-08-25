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

export default class BackupCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.moderation.backup.usage.get() });
    }
}
