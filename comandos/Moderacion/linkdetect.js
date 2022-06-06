const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'linkdetect',
	category: 'Moderación',
    premium: false,
	alias: ['linkDetect', 'link-detect'],
	description: 'Evita mensajes que incluyan enlaces.',
	usage: ['<prefix>linkDetect'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');

        if(_guild.moderation.dataModeration.events.linkDetect == false) {
            _guild.moderation.dataModeration.events.linkDetect = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Detector de enlaces activado, vuelve a escribir el comando para desactivarlo.' });
        }else{
            _guild.moderation.dataModeration.events.linkDetect = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Detector de enlaces menciones desactivado.' });
        }

    },
}