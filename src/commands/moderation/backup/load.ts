import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BackupRepository } from '../../../database/repositories/backup.repository.js';
import { Confirmation } from '../../../systems/confirmation/index.js';
import { BackupSystem, type RestoreCounts } from '../../../systems/backup/index.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

@Declare({
    name: 'load',
    description: 'Restores whatever is missing (channels, roles, bans, emojis, stickers) from the saved backup.',
    botPermissions: ['Administrator']
})

@LocalesT('commands.moderation.backup.load.name', 'commands.moderation.backup.load.description')

@Cooldown.user(30 * 60_000, { group: 'backup' })

/**
 * Restores whatever is missing in the server from its saved backup (channels, roles, bans,
 * emojis, stickers). Rate-limited to once per 30 minutes per user.
 */
export default class LoadSubCommand extends SubCommand {
    /**
     * Fetches the saved backup, optionally cleans up duplicate entities first (if the invoker
     * confirms), then restores via `BackupSystem.restore` and reports the resulting counts.
     */
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

        void dispatchLog(ctx.client, LoadSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, counts })).catch(() => {});
        await ctx.editOrReply({ content: t.restored(counts.channels, counts.roles, counts.bans, counts.emojis, counts.stickers).get() });
    }

    /** Builds the `BotActionLog` entry recording the backup restore and its counts. */
    private static log({ guildId, executorId, counts }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.BackupLoad,
            color: EmbedColors.Blurple,
            describe: (t) => t.systems.logs.actions.backupLoad(counts.channels, counts.roles, counts.bans, counts.emojis, counts.stickers).get(),
            executorId,
            data: { ...counts }
        });
    }
}

interface LogInput {
    guildId: string;
    executorId: string;
    counts: RestoreCounts;
}
