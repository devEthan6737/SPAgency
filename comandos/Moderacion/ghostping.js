const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'ghostping',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Si un mensaje con una mención es eliminado, el bot repetirá el mensaje para que se vea la mención.',
	usage: ['<prefix>ghostping'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.moderation.dataModeration.events.ghostping == false) {
            _guild.moderation.dataModeration.events.ghostping = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.mod.ghostping.message1}.` });
        }else{
            if(!_guild.moderation.dataModeration.events.ghostping) {
                _guild.moderation.dataModeration.events.ghostping = false;
                _guild.moderation.automoderator.events.ghostping = false;
            }
            _guild.moderation.dataModeration.events.ghostping = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.mod.ghostping.message2}.` });
        }

    },
}