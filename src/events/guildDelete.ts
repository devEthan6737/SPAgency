import { createEvent, Embed, EmbedColors } from 'seyfert';
import { GuildRepository } from '../database/repositories/guild.repository.js';

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
