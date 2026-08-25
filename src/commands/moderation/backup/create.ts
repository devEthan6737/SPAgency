import { Declare, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { BackupRepository } from '../../../database/repositories/backup.repository.js';
import { Confirmation } from '../../../systems/confirmation/index.js';
import { BackupSystem } from '../../../systems/backup/index.js';

@Declare({
    name: 'create',
    description: 'Snapshots this server (channels, roles, bans, emojis, stickers) so it can be restored later.'
})

@LocalesT('commands.moderation.backup.create.name', 'commands.moderation.backup.create.description')

export default class CreateSubCommand extends SubCommand {
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

        const channelCount = snapshot.channelsCategory.length + snapshot.channelsText.length + snapshot.channelsNoCategory.length;
        await ctx.editOrReply({
            content: t.created(channelCount, snapshot.roles.length, snapshot.bans.length, snapshot.emojis.length, snapshot.stickers.length).get()
        });
    }
}
