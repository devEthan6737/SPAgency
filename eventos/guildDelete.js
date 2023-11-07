require('dotenv').config();
const Discord = require('discord.js-light');
const { pulk } = require('../functions');
const Guild = require('../schemas/guildsSchema');
const Backup = require('../schemas/backupsSchema');

module.exports = async (client, guild) => {

    await Guild.findOneAndDelete({ id: guild.id });
    await Backup.findOneAndDelete({ guildId: guild.id });

    // Notificación de antiguo gremio.
    await client.channels.fetch(process.env.BOT_PRIVATE_LOGS);
    client.channels.cache.get(process.env.BOT_PRIVATE_LOGS).send({ embeds: [ new Discord.MessageEmbed().setThumbnail(`${guild.iconURL()}`).setTitle('Me han expulsado de un servidor.').addField('Servidor', `${guild.name} (${guild.id})`).addField('Idioma', `${guild.preferredLocale}`).addField('Roles', `${guild.roles.cache.size}`).addField('Miembros', `${guild.memberCount}`).setTimestamp().setColor(0x0056ff).setFooter(`${guild.name}`, `${guild.iconURL()}`) ] });
}
