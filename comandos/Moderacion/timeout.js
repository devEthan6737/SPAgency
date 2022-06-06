const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const ms = require('ms');

module.exports = {
	nombre: 'timeout',
	category: 'Moderación',
	premium: false,
	alias: ['t', 'aislar'],
	description: 'Parecido al comando mute, pero usando un sistema oficial de Discord (Aislamiento por usuario).',
	usage: ['<prefix>t <userMention> <timeout> [reason]'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('BAN_MEMBERS'))return message.channel.send(`${LANG.data.permissionsBanMe}.`);
        if(!message.member.permissions.has('KICK_MEMBERS'))return message.channel.send(`${LANG.data.permissionsKick}.`);

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('' + LANG.commands.mod.timeout.message1 + '.\n\n' + _guild.configuration.prefix + 't <userMention> <timeout> [reason]'));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply(`${LANG.commands.mod.timeout.message2}.`);
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply(`${LANG.commands.mod.timeout.message3}.`);
        if(!userMention.moderatable)return message.reply({ content: `${LANG.commands.mod.timeout.message4}.` });
        if(!args[1])return message.reply(await dataRequired('' + LANG.commands.mod.timeout.message5 + '.\n\n' + _guild.configuration.prefix + 't <userMention> <timeout> [reason]'));

        let time = ms(args[1]);
        if(!time)return message.reply('`Error 006`: No time typed.');
        if(time < ms('10m')) {
            time = ms('10m');
            args[1] = '10m';
        }
        let reason = `${LANG.commands.mod.timeout.message6}.`;
        if(args[2]) reason = args.slice(2).join(' ');

        userMention.timeout(time, `${reason}`).then(() => {
            message.reply({ content: `${LANG.commands.mod.timeout.message7} \`${userMention.user.username}\` ${LANG.commands.mod.timeout.message8} \`${args[1]}\`` });
        }).catch(() => {
            message.reply({ content: `${LANG.commands.mod.timeout.message9} \`${userMention.user.username}\`` });
        });
	},
};