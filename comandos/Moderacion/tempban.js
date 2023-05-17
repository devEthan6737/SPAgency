const Discord = require('discord.js-light');
const Timers = require('../../schemas/timersSchema');
const { dataRequired, updateDataBase } = require('../../functions');
const ms = require('ms');

module.exports = {
	nombre: 'ban',
	category: 'Moderación',
    premium: false,
	alias: ['martillo'],
	description: 'Banea a un usuario de tu servidor.',
	usage: ['<prefix>ban <userMention> <timeout> [reason]'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send({ content: LANG.data.permissionsBanMe });
		if(!message.member.permissions.has('BAN_MEMBERS')) return message.channel.send({ content: LANG.data.permissionsBan });

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired(LANG.commands.mod.tempban.message1 + _guild.configuration.prefix + LANG.commands.mod.tempban.message2));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply({ content: LANG.commands.mod.tempban.message3 });
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply({ content: LANG.commands.mod.tempban.message3});

        if(!args[1])return message.reply(await dataRequired(LANG.commands.mod.tempban.message5 + _guild.configuration.prefix + LANG.commands.mod.tempban.message2));
        let time = ms(args[1]);
        if(!time)return message.reply({ content: LANG.commands.mod.tempban.message6 });
        if(time < 120000) {
            time = 12000;
            args[1] = '2m';
        }

        if(_guild.moderation.dataModeration.forceReasons.length > 0) {
            if(!args[2])return message.reply(await dataRequired(LANG.commands.mod.tempban.message7 + _guild.configuration.prefix + LANG.commands.mod.tempban.message8 + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
            if(!_guild.moderation.dataModeration.forceReasons.includes(args[2]))return message.reply(await dataRequired(LANG.commands.mod.tempban.message9 + _guild.configuration.prefix + LANG.commands.mod.tempban.message8 + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
        }
        if(!args[2]) args[2] = LANG.commands.mod.tempban.message10;

        if(!userMention.bannable) return message.reply({ content: LANG.commands.mod.tempban.message11 });
		let userID = client.users.cache.get(userMention.id);
		userID.send(LANG.commands.mod.tempban.message12 + message.guild.name + LANG.commands.mod.tempban.message13 + args[1] + '\n' + LANG.commands.mod.tempban.message14 + message.author.tag + LANG.commands.mod.tempban.message15 + args.join(' ').split(`${args[1]} `)[1] + '`').then(x => {
            userMention.ban({ reason: args.join(' ').split(`${args[1]} `)[1] });
            let banEmbed = new Discord.MessageEmbed()
			.setDescription(`${LANG.commands.mod.tempban.message16} <@${userMention.id}> (${userMention.id})${LANG.commands.mod.tempban.message14} <@${message.author.id}> (${message.author.id})${LANG.commands.mod.tempban.message15} \`${args.join(' ').split(`${args[1]} `)[1]}\`\n${LANG.commands.mod.tempban.message17} \`${args[1]}\``)
			.setTimestamp().setColor(0x5c4fff);
            message.channel.send({ embeds: [ banEmbed ] });
        }).catch(err => {});

        // Set timer:
        _guild.moderation.dataModeration.timers.push({
            user: {
                id: userMention.id,
                username: userMention.user.username
            },
            endAt: Date.now() + time,
            action: 'UNBAN',
            channel: message.channel.id,
            inputTime: args[1]
        });
        updateDataBase(client, message.guild, _guild, true);
        let _timers = await Timers.findOne({ });
        if(!_timers.servers.includes(message.guild.id)) {
            _timers.servers.push(message.guild.id);
            _timers.save();
        }
	},
};