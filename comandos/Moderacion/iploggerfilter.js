const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'iploggerfilter',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Si se edita o se envía un link con iplogger, se eliminará.',
	usage: ['<prefix>iploggerFilter'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.moderation.dataModeration.events.iploggerFilter == false) {
            _guild.moderation.dataModeration.events.iploggerFilter = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.mod.iploggerFilter.message1}.` });
        }else{
            if(!_guild.moderation.dataModeration.events.iploggerFilter) {
                _guild.moderation.dataModeration.events.iploggerFilter = false;
                _guild.moderation.automoderator.events.iploggerFilter = false;
            }
            _guild.moderation.dataModeration.events.iploggerFilter = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.mod.iploggerFilter.message2}.` });
        }

    },
}