const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'capital-letters',
	category: 'Moderación',
    premium: false,
	alias: ['capitalLetters', 'capitalletters'],
	description: 'Evita mensajes que incluyan muchas mayúsculas.',
	usage: ['<prefix>capitalLetters'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');

        if(_guild.moderation.dataModeration.events.capitalLetters == false) {
            _guild.moderation.dataModeration.events.capitalLetters = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Detector de muchas mayúsculas activado, vuelve a escribir el comando para desactivarlo.' });
        }else{
            _guild.moderation.dataModeration.events.capitalLetters = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Detector de muchas mayúsculas desactivado.' });
        }

    },
}