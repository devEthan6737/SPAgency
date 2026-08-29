import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BackupRepository } from '../../../database/repositories/backup.repository.js';
import { Confirmation } from '../../../systems/confirmation/index.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

@Declare({
    name: 'delete',
    description: "Deletes this server's saved backup."
})

@LocalesT('commands.moderation.backup.delete.name', 'commands.moderation.backup.delete.description')

@Cooldown.user(30 * 60_000, { group: 'backup' })

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
        
        void dispatchLog(ctx.client, DeleteSubCommand.log({ guildId: guild.id, executorId: ctx.author.id })).catch(() => {});
        await ctx.editOrReply({ content: t.deleted.get() });
    }

    private static log({ guildId, executorId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.BackupDelete,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.backupDelete().get(),
            executorId
        });
    }
}

interface LogInput {
    guildId: string;
    executorId: string;
}
