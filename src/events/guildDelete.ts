import { createEvent, Embed, EmbedColors } from 'seyfert';
import { GuildRepository } from '../database/repositories/guild.repository.js';
import { DiscordErrors } from '../systems/shared/DiscordErrors.js';

/**
 * Fires when the bot leaves or is removed from a guild, and also when a guild merely goes
 * unavailable during a Discord outage, which Seyfert delivers through this same event. The row is
 * only flagged as left (`GuildRepository.markLeft`) once REST confirms the bot lost access, and is
 * never deleted here: the backup has to survive an attacker kicking the bot before a nuke, so
 * `GuildSync` purges it after a grace period instead. Then posts a notice embed to
 * `STAFF_LOGS_CHANNEL` if configured. Discord may only hand back a partial `guild` (id only), hence
 * the `'name' in guild` check before reading richer fields.
 */
export default createEvent({
    data: { name: 'guildDelete' },
    async run(guild, client) {
        if ('unavailable' in guild && guild.unavailable) return;

        const lostAccess = await client.guilds.fetch(guild.id, true).then(() => false).catch(DiscordErrors.isLostAccess);
        if (!lostAccess) return;

        await GuildRepository.markLeft(guild.id);

        const channelId = process.env.STAFF_LOGS_CHANNEL;
        if (!channelId) return;

        const channel = await client.channels.fetch(channelId).catch(() => undefined);
        if (!channel || !('messages' in channel)) return;

        const embed = new Embed().setColor(EmbedColors.Red).setDescription('Me han expulsado de un servidor.');
        if ('name' in guild) {
            embed
                .setAuthor({ name: guild.name, iconUrl: guild.iconURL() })
                .addFields(
                    { name: 'Servidor', value: `${guild.name} (${guild.id})`, inline: true },
                    { name: 'Miembros', value: `${guild.memberCount}`, inline: true },
                    { name: 'Dueño', value: `<@${guild.ownerId}>`, inline: true }
                );
        } else {
            embed.addFields({ name: 'Servidor', value: guild.id, inline: true });
        }

        await channel.messages.write({ embeds: [embed] }).catch(() => {});
    }
});
