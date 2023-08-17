const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'manyemojis',
	category: 'Moderación',
    premium: false,
	alias: ['manyEmojis', 'many-emojis'],
	description: 'Evita mensajes que incluyan muchos emojis.',
	usage: ['<prefix>manyEmojis [maxAmountDetect]'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(args[0]) {
            if(isNaN(parseInt(args[0])))return message.reply(LANG.commands.mod.manyemojis.message1);
            _guild.moderation.automoderator.actions.manyEmojis = parseInt(args[0]);
            updateDataBase(client, message.guild, _guild, true);
            message.reply(LANG.commands.mod.manyemojis.message2);
        }else{
            if(_guild.moderation.dataModeration.events.manyEmojis == false) {
                _guild.moderation.dataModeration.events.manyEmojis = true;
                updateDataBase(client, message.guild, _guild, true);
                message.reply(LANG.commands.mod.manyemojis.message3);
            }else{
                _guild.moderation.dataModeration.events.manyEmojis= false;
                updateDataBase(client, message.guild, _guild, true);
                message.reply(LANG.commands.mod.manyemojis.message4);
            }
        }

    },
}