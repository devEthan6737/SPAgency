const Discord = require('discord.js-light');
const { pulk } = require('../functions');
const Guild = require('../schemas/guildsSchema');
const Backup = require('../schemas/backupsSchema');
const antiRF = require('../schemas/antiRF_Schema');

module.exports = async (client, guild) => {

    await Guild.findOneAndDelete({ id: guild.id });
    await Backup.findOneAndDelete({ guildId: guild.id });

    let user = await antiRF.findOne({ user: guild.ownerId });
    if(user) {
        if(user.servers.includes(guild.id)) {
            user.servers = await pulk(user.servers, guild.id);
            user.save();
        }
    }

    // Notificación de antiguo gremio.
    await client.channels.fetch('822642842098597958');
    client.channels.cache.get('822642842098597958').send({ embeds: [ new Discord.MessageEmbed().setThumbnail(`${guild.iconURL()}`).setTitle('Me han expulsado de un servidor.').addField('Servidor', `${guild.name} (${guild.id})`).addField('Region', `${guild.region}`).addField('Roles', `${guild.roles.cache.size}`).addField('Miembros', `${guild.memberCount}`).setTimestamp().setColor(0x0056ff).setFooter(`${guild.name}`, `${guild.iconURL()}`) ] });
}