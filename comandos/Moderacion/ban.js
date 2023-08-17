const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');

module.exports = {
	nombre: 'ban',
	category: 'Moderación',
	premium: false,
	alias: ['martillo'],
	description: 'Banea a un usuario de tu servidor.',
	usage: ['<prefix>ban <userMention> [reason]'],
	run: async (client, message, args, _guild) => {
		let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send({ content: LANG.data.permissionsBanMe });
		if(!message.member.permissions.has('BAN_MEMBERS')) return message.channel.send({ content: LANG.data.permissionsBan });

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired(LANG.commands.mod.ban.message1 + '\n\n' + _guild.configuration.prefix + 'ban <userMention> [reason]'));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply(LANG.commands.mod.ban.message2);
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply(LANG.commands.mod.ban.message3);

        if(_guild.moderation.dataModeration.forceReasons.length > 0) {
            if(!args[1])return message.reply(await dataRequired(LANG.commands.mod.ban.message4 + '\n\n' + _guild.configuration.prefix + 'kick <userMention> <reason>\n\n' + LANG.commands.mod.ban.message5 + ' ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
            if(!_guild.moderation.dataModeration.forceReasons.includes(args[1]))return message.reply(await dataRequired(LANG.commands.mod.ban.message6 + '\n\n' + _guild.configuration.prefix + 'kick <userMention> <reason>\n\n' + LANG.commands.mod.ban.message5 + ' ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
        }
        if(!args[1]) args[1] = LANG.commands.mod.ban.message7;

        if(!userMention.bannable) return message.reply(LANG.commands.mod.ban.message8);
		let userID = client.users.cache.get(userMention.id);
		userID.send(LANG.commands.mod.ban.message9.replace('<guild>', message.guild.name).replace('<moderator>', message.author.tag).replace('<reason>', args.join(' ').split(`${userMention.id}> `)[1])).catch(err => {});
		userMention.ban({ reason: args.join(' ').split(`${userMention.id}> `)[1] });
		let banEmbed = new Discord.MessageEmbed()
			.setDescription(LANG.commands.mod.ban.message10.replace('<userMention>', '<@' + userMention.id + '>').replace('<userMentionId>', userMention.id).replace('<authorMention>', '<@' + message.author.id + '>').replace('<authorId>', message.author.id).replace('<reason>', args.join(' ').split(`${userMention.id}> `)[1]))
			.setTimestamp().setColor(0x5c4fff);
		message.channel.send({ embeds: [ banEmbed ] });
	},
};