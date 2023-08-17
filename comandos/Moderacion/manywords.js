const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'manywords',
	category: 'Moderación',
    premium: false,
	alias: ['manyWords', 'many-words'],
	description: 'Evita mensajes que incluyan muchos caracteres.',
	usage: ['<prefix>manyWords [maxAmountDetect]'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(args[0]) {
            if(isNaN(parseInt(args[0])))return message.reply(LANG.commands.mod.manywords.message1);
            _guild.moderation.automoderator.actions.manyWords = parseInt(args[0]);
            updateDataBase(client, message.guild, _guild, true);
            message.reply(LANG.commands.mod.manywords.message2);
        }else{
            if(_guild.moderation.dataModeration.events.manyWords == false) {
                _guild.moderation.dataModeration.events.manyWords = true;
                updateDataBase(client, message.guild, _guild, true);
                message.reply(LANG.commands.mod.manywords.message3);
            }else{
                _guild.moderation.dataModeration.events.manyWords = false;
                updateDataBase(client, message.guild, _guild, true);
                message.reply(LANG.commands.mod.manywords.message4);
            }
        }

    },
}