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
		if(!message.guild.me.permissions.has('MANAGE_ROLES')) return message.channel.send('Necesito permiso de __Gestionar Roles__.');
		if(!message.member.permissions.has('KICK_MEMBERS')) return message.channel.send('Necesitas permiso de __Expulsar Miembros__.');
        if(!_guild.moderation.dataModeration.muterole)return message.channel.send(`Se debe especificar el rol de muteo con \`${_guild.configuration.prefix}setmuterole <roleMention>\``);

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('Debes mencionar al usuario que deseas mutear.\n\n' + _guild.configuration.prefix + 'mute <userMention> [timeout]'));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply('No.');
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply('La persona tiene un rol más alto que tú o tiene el mismo rol.');
        if(userMention.roles.cache.has(_guild.moderation.dataModeration.muterole))return message.channel.send('Ese usuario ya estaba muteado.');

        let time;
        if(args[1]) {
            time = ms(args[1]);
            if(!time)return message.reply('`Error 006`: No time typed.');
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
            message.reply({ content: `He muteado a \`${userMention.user.username}\` hasta que alguien elimine su rol de forma manual o con \`${_guild.configuration.prefix}unmute <userMention>\`.`});
        }else{

            message.reply({ content: `He muteado a \`${userMention.user.username}\` durante \`${args[1]}\`` });
            
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