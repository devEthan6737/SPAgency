const Discord = require('discord.js-light');
const Timers = require('../../schemas/timersSchema');
const { dataRequired, pulk, updateDataBase } = require('../../functions');
const ms = require('ms');

module.exports = {
	nombre: 'unmute',
	category: 'Moderación',
    premium: false,
	alias: ['on'],
	description: 'Desmutea a un usuario de tu servidor.',
	usage: ['<prefix>unmute <userMention>'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('MANAGE_ROLES'))return message.channel.send(`${LANG.data.permissionsRolesme}.`);
        if(!message.member.permissions.has('KICK_MEMBERS'))return message.channel.send(`${LANG.data.permissionsKick}.`);
        if(!_guild.moderation.dataModeration.muterole)return message.channel.send(`Se debe especificar el rol de muteo con \`${_guild.configuration.prefix}setmuterole <roleMention>\``)

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('' + LANG.commands.mod.unmute.message1 + '.\n\n' + _guild.configuration.prefix + 'unmute <userMention>'));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply(`${LANG.commands.mod.unmute.message2}.`);
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply(`${LANG.commands.mod.unmute.message3}.`);
        if(!userMention.roles.cache.has(_guild.moderation.dataModeration.muterole))return message.channel.send(`${LANG.commands.mod.unmute.message4}.`);

        try{
            userMention.roles.remove(_guild.moderation.dataModeration.muterole).catch(err => {
                message.channel.send(err);
            });
        }catch(err) {
            message.channel.send(err);
        }

        _guild.moderation.dataModeration.timers.forEach(async x => {
            if(x.user.id == userMention.id) {
                x.user.roles.forEach(i => {
                    userMention.roles.add(i).catch(err => {});
                });
                _guild.moderation.dataModeration.timers = await pulk(_guild.moderation.dataModeration.timers, x);
            }
        });
        updateDataBase(client, message.guild, _guild, true);
        let _timers = await Timers.findOne({ });
        if(_timers.servers.includes(message.guild.id)) {
            if(_guild.moderation.dataModeration.timers.length == 0) {
                _timers.servers = await pulk(_timers.servers, message.guild.id);
                _timers.save();
            }
        }

        message.reply({ content: `${LANG.commands.mod.unmute.message5}.` });

	},
};