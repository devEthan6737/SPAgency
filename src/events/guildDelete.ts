import { createEvent, Embed, EmbedColors } from 'seyfert';
import { GuildRepository } from '../database/repositories/guild.repository.js';

/**
 * Fires when the bot leaves or is removed from a guild. Deletes that guild's row via
 * `GuildRepository.delete` so no config lingers for a server the bot no longer serves, then posts a
 * notice embed to `STAFF_LOGS_CHANNEL` if configured. Discord may only hand back a partial `guild`
 * (id only) in this event, hence the `'name' in guild` check before reading richer fields.
 */
export default createEvent({
    data: { name: 'guildDelete' },
    async run(guild, client) {
        await GuildRepository.delete(guild.id);

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
