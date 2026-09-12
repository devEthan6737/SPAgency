import { createEvent, Embed, EmbedColors } from 'seyfert';
import { GuildRepository } from '../database/repositories/guild.repository.js';

/**
 * Fires when the bot joins a new guild. Ensures a `guild_configuration`/`guild_protection` row exists
 * for it (`GuildRepository.findOrCreate`) so every config lookup elsewhere can assume one, then posts
 * a notice embed to `STAFF_LOGS_CHANNEL` if that env var is configured — silently skipped otherwise.
 */
export default createEvent({
    data: { name: 'guildCreate' },
    async run(guild, client) {
        await GuildRepository.findOrCreate(guild.id, guild.ownerId);

        const channelId = process.env.STAFF_LOGS_CHANNEL;
        if (!channelId) return;

        const channel = await client.channels.fetch(channelId).catch(() => undefined);
        if (!channel || !('messages' in channel)) return;

        const embed = new Embed()
            .setColor(EmbedColors.Blurple)
            .setAuthor({ name: guild.name, iconUrl: guild.iconURL() })
            .setDescription('Nuevo servidor.')
            .addFields(
                { name: 'Servidor', value: `${guild.name} (${guild.id})`, inline: true },
                { name: 'Miembros', value: `${guild.memberCount}`, inline: true },
                { name: 'Dueño', value: `<@${guild.ownerId}>`, inline: true }
            );

        await channel.messages.write({ embeds: [embed] }).catch(() => {});
    }
});
