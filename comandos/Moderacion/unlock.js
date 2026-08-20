const { PermissionFlagsBits } = require('discord.js');
module.exports = {
	nombre: 'unlock',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Desbloquea un canal para que solo el personal pueda enviar mensajes.',
	usage: ['<prefix>lock [@roleMention]'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('MANAGE_CHANNLES'))return message.reply('Necesito permisos de __Gestionar canales__.');
        if(!message.member.permissions.has(PermissionFlagsBits.ManageChannels))return message.reply('Necesitas permisos de __Gestionar canales__.');

        try{
            await message.guild.channels.fetch();
            let role = message.mentions.roles.first();
            if(role) {
                message.channel.permissionOverwrites.edit(role, {
                    SEND_MESSAGES: true
                }).catch(err => message.channel.send(err.toString()));
                message.react('👍');
            }else{
                message.channel.permissionOverwrites.edit(message.guild.id, {
                    SEND_MESSAGES: true
                }).catch(err => message.channel.send(err.toString()));
                message.react('👍');
            }
        }catch(err) {
            message.channel.send(err.toString());
        }
    },
};