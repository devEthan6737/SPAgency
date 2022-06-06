const { dataRequired } = require("../../functions");

module.exports = {
	nombre: 'verify',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Verifica a un usuario nuevo en tu servidor.',
	usage: ['<prefix>verify <userMention>'],
	run: async (client, message, args, _guild) => {
        try{
            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply({ content: 'Necesito permiso de __Administrador__.', ephemeral: true });
            if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply({ content: 'Necesitas permisos de __Gestionar Roles__.', ephemeral: true });

            let member = message.mentions.members.first();
            if(!member)return message.reply(await dataRequired('No has mencionado al miembro para verificar.\n\n' + _guild.configuration.prefix + 'verify <userMention>'));

            if(_guild.protection.verification.enable == false)return message.reply({ content: 'El sistema de verificación no está activado.' });
            if(member.roles.cache.has(_guild.protection.verification.role))return message.reply({ content: 'El usuario ya está verificado.' });
            member.roles.add(_guild.protection.verification.role);
            message.reply({ content: 'Usuario verificado manualmente.' });
        }catch(err) {}
	},
};