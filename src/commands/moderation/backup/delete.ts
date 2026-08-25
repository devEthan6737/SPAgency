import { Declare, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { BackupRepository } from '../../../database/repositories/backup.repository.js';
import { Confirmation } from '../../../systems/confirmation/index.js';

@Declare({
    name: 'delete',
    description: "Deletes this server's saved backup."
})

@LocalesT('commands.moderation.backup.delete.name', 'commands.moderation.backup.delete.description')

export default class DeleteSubCommand extends SubCommand {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.backup;

        const guild = await ctx.guild();
        const backup = await BackupRepository.get(guild.id);
        if (!backup) return await ctx.write({ content: t.none.get() });

        const confirmed = await Confirmation.ask(ctx, {
            description: t.deletePrompt.get(),
            confirmLabel: t.deleteYes.get(),
            cancelLabel: t.deleteNo.get()
        });
        
        if (!confirmed) return;

        await BackupRepository.delete(guild.id);
        await ctx.editOrReply({ content: t.deleted.get() });
    }
}
