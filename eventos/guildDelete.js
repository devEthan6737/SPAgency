require('dotenv').config();
const Discord = require('discord.js');
const { pulk } = require('../functions');
const Guild = require('../schemas/guildsSchema');
const Backup = require('../schemas/backupsSchema');

module.exports = async (client, guild) => {

    await Guild.findOneAndDelete({ id: guild.id });
    await Backup.findOneAndDelete({ guildId: guild.id });

    // Notificación de antiguo gremio.
    await client.channels.fetch(process.env.BOT_PRIVATE_LOGS);
    client.channels.cache.get(process.env.BOT_PRIVATE_LOGS).send({ embeds: [ new Discord.EmbedBuilder().setThumbnail(`${guild.iconURL()}`).setTitle('Me han expulsado de un servidor.').addFields({ name: 'Servidor', value: `${guild.name} (${guild.id})` }).addFields({ name: 'Idioma', value: `${guild.preferredLocale}` }).addFields({ name: 'Roles', value: `${guild.roles.cache.size}` }).addFields({ name: 'Miembros', value: `${guild.memberCount}` }).setTimestamp().setColor(0x0056ff).setFooter({ text: `${guild.name}`, iconURL: `${guild.iconURL()}` }) ] });
}
