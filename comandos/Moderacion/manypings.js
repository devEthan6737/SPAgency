const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'manypings',
	category: 'Moderación',
    premium: false,
	alias: ['manyPings', 'many-pings'],
	description: 'Evita mensajes que incluyan muchas menciones.',
	usage: ['<prefix>manyPings [maxAmountDetect]'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(args[0]) {
            if(isNaN(parseInt(args[0])))return message.reply(LANG.commands.mod.manyping.message1);
            _guild.moderation.automoderator.actions.manyPings = parseInt(args[0]);
            updateDataBase(client, message.guild, _guild, true);
            message.reply(LANG.commands.mod.manyping.message2);
        }else{
            if(_guild.moderation.dataModeration.events.manyPings == false) {
                _guild.moderation.dataModeration.events.manyPings = true;
                updateDataBase(client, message.guild, _guild, true);
                message.reply(LANG.commands.mod.manyping.message3);
            }else{
                _guild.moderation.dataModeration.events.manyPings = false;
                updateDataBase(client, message.guild, _guild, true);
                message.reply(LANG.commands.mod.manyping.message4);
            }
        }

    },
}