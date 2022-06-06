const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const ms = require('ms');

module.exports = {
	nombre: 'untimeout',
	category: 'Moderación',
	premium: false,
	alias: ['ut'],
	description: 'Eliminar el aislamiento de un usuario.',
	usage: ['<prefix>t <userMention>'],
	run: async (client, message, args, _guild) => {
		let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('BAN_MEMBERS'))return message.channel.send(`${LANG.data.permissionsBanMe}.`);
        if(!message.member.permissions.has('KICK_MEMBERS'))return message.channel.send(`${LANG.data.permissionsKick}.`);

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('' + LANG.commands.mod.untimeout.message1 + '.\n\n' + _guild.configuration.prefix + 't <userMention> <timeout> [reason]'));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply(`${LANG.commands.mod.unwarn.message2}.`);
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply(`${LANG.commands.mod.untimeout.message3}.`);
        if(!userMention.moderatable)return message.reply({ content: `${LANG.commands.mod.untimeout.message4}.` });

        userMention.timeout(null).then(() => {
            message.reply({ content: `${LANG.commands.mod.untimeout.message5} \`${userMention.user.username}\`,` });
        }).catch(() => {
            message.reply({ content: `${LANG.commands.mod.untimeout.message6} \`${userMention.user.username}\`` });
        });
	},
};