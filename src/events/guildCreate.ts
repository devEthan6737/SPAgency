import { createEvent, Embed, EmbedColors } from 'seyfert';
import { GuildRepository } from '../database/repositories/guild.repository.js';

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
