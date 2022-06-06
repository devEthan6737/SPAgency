const Discord = require('discord.js-light');
const ms = require('ms')

module.exports = {
	nombre: 'muteinfo',
	category: 'Moderación',
    premium: false,
	alias: ['off'],
	description: 'Obtén información sobre una persona muteada o todos los usuarios muteados.',
	usage: ['<prefix>muteinfo [userMention]'],
	run: async (client, message, args, _guild) => {
		if(!message.guild.me.permissions.has('MANAGE_ROLES')) return message.channel.send('Necesito permiso de __Gestionar Roles__.');
		if(!message.member.permissions.has('KICK_MEMBERS')) return message.channel.send('Necesitas permiso de __Expulsar Miembros__.');
        if(!_guild.moderation.dataModeration.muterole)return message.channel.send(`Se debe especificar el rol de muteo con \`${_guild.configuration.prefix}setmuterole <roleMention>\``);

		let userMention = message.mentions.members.first();
        if(!userMention) {
            if(_guild.moderation.dataModeration.timers.length > 20)return message.reply({ content: `Hay \`${_guild.moderation.dataModeration.timers.length}\` usuarios muteados.`, components: [
                new Discord.MessageActionRow()
                .addComponents(new Discord.MessageButton()
                    .setLabel('Desmutear a todos.')
                    .setEmoji('🛑')
                    .setCustomId('unmuteAll')
                    .setStyle('DANGER'),
                )
            ] });
            let cc = 1;
            message.reply({ content: `Hay \`${_guild.moderation.dataModeration.timers.length}\` usuarios muteados.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff)
                .setAuthor('Usuarios muteados:').setDescription(`${_guild.moderation.dataModeration.timers.map(x => `\`${cc++}.\` ${x.user.username}`).join('\n')}`)
            ], components: [
                new Discord.MessageActionRow()
                    .addComponents(new Discord.MessageButton()
                        .setLabel('Desmutear a todos.')
                        .setEmoji('🛑')
                        .setCustomId('unmuteAll')
                        .setStyle('DANGER'),
                    )
            ] });
        }else{
            if(userMention.id == client.user.id)return;
            if(userMention.id == message.author.id)return message.reply('Es estuvieses muteado, ¿cómo escribes el comando?.');
            if(!userMention.roles.cache.has(_guild.moderation.dataModeration.muterole))return message.channel.send('Beep, beep. El usuario no está muteado.');

            let has = false;
            _guild.moderation.dataModeration.timers.forEach(x => {
                if(x.user.id == userMention.id) {
                    has = true;
                    message.reply({ embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(`${userMention.user.tag}`, `${userMention.user.displayAvatarURL()}`)
                        .setDescription(`Roles almacenados: \`${x.user.roles.length} roles\`\nDesmuteo programado para: \`${new Date(x.endAt)}, dentro de ${ms(x.endAt - Date.now())}\`\nFue muteado en el canal: \`${x.channel}\``)
                    ] });
                }
            });
            if(has == false)return message.channel.send({ content: 'El usuario está muteado de por vida.' });
        }
	},
};