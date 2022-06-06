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
		if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send('Necesito permiso de __Banear Miembros__.');
		if(!message.member.permissions.has('BAN_MEMBERS')) return message.channel.send('Necesitas permiso de __Banear Miembros__.');

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('Debes mencionar al usuario que deseas banear.\n\n' + _guild.configuration.prefix + 'tempban <userMention> <timeout> [reason]'));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply('No.');
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply('La persona tiene un rol más alto que tú o tiene el mismo rol.');

        if(!args[1])return message.reply(await dataRequired('Debes escribir el tiempo que estará baneado el usuario.\n\n' + _guild.configuration.prefix + 'tempban <userMention> <timeout> [reason]'));
        let time = ms(args[1]);
        if(!time)return message.reply('`Error 006`: No time typed.');
        if(time < 120000) {
            time = 12000;
            args[1] = '2m';
        }

        if(_guild.moderation.dataModeration.forceReasons.length > 0) {
            if(!args[2])return message.reply(await dataRequired('El servidor tiene razones forzadas activas, es necesario adjuntar una razón en la sanción.\n\n' + _guild.configuration.prefix + 'tempban <userMention> <timeout> <reason>\n\nRazones forzadas: ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
            if(!_guild.moderation.dataModeration.forceReasons.includes(args[2]))return message.reply(await dataRequired('Esa razón no es válida, el servidor tiene razones forzadas activas.\n\n' + _guild.configuration.prefix + 'tempban <userMention> <reason>\n\nRazones forzadas: ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
        }
        if(!args[2]) args[2] = 'Sin especificar.';

        if(!userMention.bannable) return message.reply('No puedo banear al usuario mencionado.');
		let userID = client.users.cache.get(userMention.id);
		userID.send('Has sido baneado temporalmente de `' + message.guild.name + '` durante `' + args[1] + '`.\n\n**Moderador:** `' + message.author.tag + '`\n**__Razón:__** `' + args.join(' ').split(`${args[1]} `)[1] + '`').then(x => {
            userMention.ban({ reason: args.join(' ').split(`${args[1]} `)[1] });
            let banEmbed = new Discord.MessageEmbed()
			.setDescription(`**__Miembro baneado:__** <@${userMention.id}> (${userMention.id})\n**__Moderador:__** <@${message.author.id}> (${message.author.id})\n**__Razón:__** \`${args.join(' ').split(`${args[1]} `)[1]}\`\n**__Duración del baneo:__** \`${args[1]}\``)
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