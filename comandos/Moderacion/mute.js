const Discord = require('discord.js-light');
const Timers = require('../../schemas/timersSchema');
const { dataRequired, updateDataBase } = require('../../functions');
const ms = require('ms');

module.exports = {
	nombre: 'mute',
	category: 'Moderación',
    premium: false,
	alias: ['off'],
	description: 'Mutea a un usuario de tu servidor.',
	usage: ['<prefix>mute <userMention> [timeout]'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('MANAGE_ROLES')) return message.channel.send({ content: LANG.data.permissionsRolesme });
		if(!message.member.permissions.has('KICK_MEMBERS')) return message.channel.send({ content: LANG.data.permissionsKick });
        if(!_guild.moderation.dataModeration.muterole)return message.channel.send(LANG.commands.mod.mute.message1.replace('<prefix>', _guild.configuration.prefix));

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired(LANG.commands.mod.mute.message2 + '\n\n' + _guild.configuration.prefix + 'mute <userMention> [timeout]'));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply(LANG.commands.mod.mute.message3);
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply(LANG.commands.mod.mute.message4);
        if(userMention.roles.cache.has(_guild.moderation.dataModeration.muterole))return message.channel.send(LANG.commands.mod.mute.message5);

        let time;
        if(args[1]) {
            time = ms(args[1]);
            if(!time)return message.reply(LANG.commands.mod.mute.message6);
            if(time < 120000) {
                time = 120000;
                args[1] = '2m';
            }
        }else{
            time = "infinite";
        }

        let remember = [];

        try{
            userMention.roles.cache.forEach(x => {
                remember.push(x.id);
                userMention.roles.remove(x.id).catch(err => {});
            });
        
            userMention.roles.add(_guild.moderation.dataModeration.muterole).catch(err => {
                message.channel.send(err);
            });
        }catch(err) {
            message.channel.send(err);
        }

        if(time == 'infinite') {
            message.reply(LANG.commands.mod.mute.message7.replace('<prefix>', _guild.configuration.prefix).replace('<username>', userMention.user.username));
        }else{

            message.reply(LANG.commands.mod.mute.message8.replace('<username>', userMention.user.username).replace('<time>', args[1]));
            
            // Set timer:
            _guild.moderation.dataModeration.timers.push({
                user: {
                    id: userMention.id,
                    username: userMention.user.username,
                    roles: remember
                },
                endAt: Date.now() + time,
                action: 'UNMUTE',
                channel: message.channel.id,
                inputTime: args[1]
            });
            updateDataBase(client, message.guild, _guild, true);
            let _timers = await Timers.findOne({ });
            if(!_timers.servers.includes(message.guild.id)) {
                _timers.servers.push(message.guild.id);
                _timers.save();
            }

        }
	},
};
