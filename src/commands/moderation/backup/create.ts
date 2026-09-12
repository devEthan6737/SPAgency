import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BackupRepository } from '../../../database/repositories/backup.repository.js';
import { Confirmation } from '../../../systems/confirmation/index.js';
import { BackupSystem, type RestoreCounts } from '../../../systems/backup/index.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

@Declare({
    name: 'create',
    description: 'Snapshots this server (channels, roles, bans, emojis, stickers) so it can be restored later.'
})

@LocalesT('commands.moderation.backup.create.name', 'commands.moderation.backup.create.description')

@Cooldown.user(30 * 60_000, { group: 'backup' })

/**
 * Snapshots the server (channels, roles, bans, emojis, stickers) and saves it as the guild's
 * backup, overwriting any existing one after confirmation. Rate-limited to once per 30 minutes
 * per user.
 */
export default class CreateSubCommand extends SubCommand {
    /**
     * Confirms overwrite if a backup already exists, takes a snapshot via `BackupSystem.snapshot`,
     * persists it, and reports the resulting counts.
     */
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.backup;
        const guild = await ctx.guild();

        if (await BackupRepository.get(guild.id)) {
            const confirmed = await Confirmation.ask(ctx, {
                description: t.overwritePrompt.get(),
                confirmLabel: t.overwriteYes.get(),
                cancelLabel: t.overwriteNo.get()
            });
            if (!confirmed) return;
        }

        await ctx.editOrReply({ content: t.creating.get() });

        const snapshot = await BackupSystem.snapshot(guild);
        await BackupRepository.save(guild.id, snapshot);

        const counts: RestoreCounts = {
            channels: snapshot.channelsCategory.length + snapshot.channelsText.length + snapshot.channelsNoCategory.length,
            roles: snapshot.roles.length,
            bans: snapshot.bans.length,
            emojis: snapshot.emojis.length,
            stickers: snapshot.stickers.length
        };
        
        void dispatchLog(ctx.client, CreateSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, counts })).catch(() => {});

        await ctx.editOrReply({
            content: t.created(counts.channels, counts.roles, counts.bans, counts.emojis, counts.stickers).get()
        });
    }

    /** Builds the `BotActionLog` entry recording the backup creation and its counts. */
    private static log({ guildId, executorId, counts }: LogInput): BotActionLog {
        return new BotActionLog(guildId, {
            type: BotActionType.BackupCreate,
            color: EmbedColors.Blurple,
            describe: (t) => t.systems.logs.actions.backupCreate(counts.channels, counts.roles, counts.bans, counts.emojis, counts.stickers).get(),
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
