module.exports = {
	nombre: 'lock',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Bloquea un canal para que solo el personal pueda enviar mensajes.',
	usage: ['<prefix>lock [@roleMention]'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('MANAGE_CHANNLES'))return message.reply('Necesito permisos de __Gestionar canales__.');
        if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.reply('Necesitas permisos de __Gestionar canales__.');

        try{
            await message.guild.channels.fetch();
            let role = message.mentions.roles.first();
            if(role) {
                message.channel.permissionOverwrites.edit(role, {
                    SEND_MESSAGES: false
                }).catch(err => message.channel.send(err.toString()));
                message.react('👍');
            }else{
                message.channel.permissionOverwrites.edit(message.guild.id, {
                    SEND_MESSAGES: false
                }).catch(err => message.channel.send(err.toString()));
                message.react('👍');
            }
        }catch(err) {
            message.channel.send(err.toString());
        }
    },
};