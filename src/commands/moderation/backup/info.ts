import { Declare, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { BackupRepository } from '../../../database/repositories/backup.repository.js';

@Declare({
    name: 'info',
    description: "Shows this server's saved backup, if any."
})

@LocalesT('commands.moderation.backup.info.name', 'commands.moderation.backup.info.description')

export default class InfoSubCommand extends SubCommand {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.backup;

        const guild = await ctx.guild();
        const backup = await BackupRepository.get(guild.id);
        if (!backup) return await ctx.write({ content: t.none.get() });

        const channelCount = backup.channelsCategory.length + backup.channelsText.length + backup.channelsNoCategory.length;

        await ctx.write({
            content: t.details(
                backup.name ?? '?',
                channelCount,
                backup.roles.length,
                backup.bans.length,
                backup.emojis.length,
                backup.stickers.length,
                backup.createdAt
            ).get()
        });
    }
}
