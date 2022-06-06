const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'nsfwfilter',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Si alguien escribe un mensaje con contenido pornográfico, se eliminará.',
	usage: ['<prefix>nsfwFilter'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.moderation.dataModeration.events.nsfwFilter == false) {
            _guild.moderation.dataModeration.events.nsfwFilter = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.mod.nsfwFilter.message1}.` });
        }else{
            if(!_guild.moderation.dataModeration.events.nsfwFilter) {
                _guild.moderation.dataModeration.events.nsfwFilter = false;
                _guild.moderation.automoderator.events.nsfwFilter = false;
            }
            _guild.moderation.dataModeration.events.nsfwFilter = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.mod.nsfwFilter.message2}.` });
        }

    },
}