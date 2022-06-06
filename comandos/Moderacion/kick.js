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
		if(!message.guild.me.permissions.has('KICK_MEMBERS')) return message.channel.send('Necesito permiso de __Expulsar Miembros__.');
		if(!message.member.permissions.has('KICK_MEMBERS'))return message.channel.send('Necesitas permisos de __Expulsar Miembros__.');
		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('Debes mencionar al usuario que deseas expulsar.\n\n' + _guild.configuration.prefix + 'kick <userMention> [reason]'));
		if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply('No.');
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply('La persona tiene un rol más alto que tú o tiene el mismo rol.');

        if(_guild.moderation.dataModeration.forceReasons.length > 0) {
            if(!args[1])return message.reply(await dataRequired('El servidor tiene razones forzadas activas, es necesario adjuntar una razón en la sanción.\n\n' + _guild.configuration.prefix + 'kick <userMention> <reason>\n\nRazones forzadas: ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
            if(!_guild.moderation.dataModeration.forceReasons.includes(args[1]))return message.reply(await dataRequired('Esa razón no es válida, el servidor tiene razones forzadas activas.\n\n' + _guild.configuration.prefix + 'kick <userMention> <reason>\n\nRazones forzadas: ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
        }
        if(!args[1]) args[1] = 'Sin especificar.';

        let userID = client.users.cache.get(userMention.id);
		userID.send('Has sido expulsado de `' + message.guild.name + '`.\n\n**Moderador:** `' + message.author.tag + '`\n**Razón:** `' + args.join(' ').split(`${userMention.id}> `)[1] + '`').then(() => {
			message.channel.send(`<a:sp_loading:805810562349006918> | \`Estoy recorriendo mis datos antes de expulsar a ${userMention.tag}.\``).then(b => {
				let kickEmbed = new Discord.MessageEmbed()
					.setDescription(`**__Miembro expulsado:__** <@${userMention.id}> (${userMention.id})\n**__Moderador:__** <@${message.author.id}> (${message.author.id})\n**__Razón:__** \`${args.join(' ').split(`${userMention.id}> `)[1]}\``)
					.setColor(0x5c4fff).setTimestamp();
				b.delete();
                message.guild.members.kick(userMention, args.join(' ').split(`${userMention.id}> `)[1]).then(() => {
                    message.channel.send({ embeds: [ kickEmbed ] });
                }).catch(err => {
                    message.channel.send('No he podido expulsar al miembro mencionado.');
                });
			});
		});
	},
};