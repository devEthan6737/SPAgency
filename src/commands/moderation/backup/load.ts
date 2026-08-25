import { Declare, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { BackupRepository } from '../../../database/repositories/backup.repository.js';
import { Confirmation } from '../../../systems/confirmation/index.js';
import { BackupSystem } from '../../../systems/backup/index.js';

@Declare({
    name: 'load',
    description: 'Restores whatever is missing (channels, roles, bans, emojis, stickers) from the saved backup.',
    botPermissions: ['Administrator']
})

@LocalesT('commands.moderation.backup.load.name', 'commands.moderation.backup.load.description')

export default class LoadSubCommand extends SubCommand {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.backup;

        const guild = await ctx.guild();
        const backup = await BackupRepository.get(guild.id);
        if (!backup) return await ctx.write({ content: t.none.get() });

        const cleanFirst = await Confirmation.ask(ctx, {
            description: t.cleanupPrompt.get(),
            confirmLabel: t.cleanupYes.get(),
            cancelLabel: t.cleanupNo.get()
        });

        await ctx.editOrReply({ content: t.restoring.get() });

        if (cleanFirst) await BackupSystem.cleanupDuplicates(guild);

        const counts = await BackupSystem.restore(guild, backup);

        await ctx.editOrReply({ content: t.restored(counts.channels, counts.roles, counts.bans, counts.emojis, counts.stickers).get() });
    }
}
