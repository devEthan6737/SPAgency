const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');

module.exports = {
	nombre: 'kick',
	category: 'Moderación',
	premium: false,
	alias: [],
	description: 'Expulsa a un usuario de tu servidor.',
	usage: ['<prefix>kick <userMention> [reason]'],
	run: async (client, message, args, _guild) => {
		let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('KICK_MEMBERS'))return message.channel.send(`${LANG.data.permissionsKickMe}.`);
		if(!message.member.permissions.has('KICK_MEMBERS'))return message.channel.send(`${LANG.data.permissionsKick}.`);

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired(LANG.commands.mod.kick.message1 + '\n\n' + _guild.configuration.prefix + 'kick <userMention> [reason]'));
		if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply(LANG.commands.mod.kick.message2);
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply(LANG.commands.mod.kick.message3);

        if(_guild.moderation.dataModeration.forceReasons.length > 0) {
            if(!args[1])return message.reply(await dataRequired(LANG.commands.mod.kick.message4 + '\n\n' + _guild.configuration.prefix + 'kick <userMention> <reason>\n\n' + LANG.commands.mod.kick.message5 + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
            if(!_guild.moderation.dataModeration.forceReasons.includes(args[1]))return message.reply(await dataRequired(LANG.commands.mod.kick.message6 + '\n\n' + _guild.configuration.prefix + 'kick <userMention> <reason>\n\n' + LANG.commands.mod.kick.message5 + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
        }
        if(!args[1]) args[1] = LANG.commands.mod.kick.message7;

        let userID = client.users.cache.get(userMention.id);
		userID.send(LANG.commands.mod.kick.message8.replace('<guildName>', message.guild.name).replace('<moderatorTag>', message.author.tag).replace('<reason>', args.join(' ').split(`${userMention.id}> `)[1])).catch(err => {});
		message.guild.members.kick(userMention, args.join(' ').split(`${userMention.id}> `)[1]).catch(err => {});
		let kickEmbed = new Discord.MessageEmbed()
			.setDescription(LANG.commands.mod.kick.message9.replace('<userMention>', `<@${userMention.id}>`).replace('<userMentionId>', userMention.id).replace('<authorMention>', `<@${message.author.id}>`).replace('<authorId>', message.author.id).replace('<reason>', `${args.join(' ').split(`${userMention.id}> `)[1]}`))
			.setColor(0x5c4fff).setTimestamp();
		message.channel.send({ embeds: [ kickEmbed ] });
	},
};