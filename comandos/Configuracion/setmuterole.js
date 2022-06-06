const { dataRequired, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'setmuterole',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Establece un rol de muteo en el servidor.',
	usage: ['<prefix>setmurerole <roleMention>'],
	run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('MANAGE_ROLES'))return message.reply({ content: 'Necesito permisos de __Gestionar Roles__.' });
        if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply({ content: 'Necesitas permisos de __Gestionar Roles__.' });

        try{
            let roleMention = message.mentions.roles.first();
            if(!roleMention)return message.reply(await dataRequired('Debes mencionar el rol que deseas establecer como rol de muteo.\n\n' + _guild.configuration.prefix + 'setmuterole <roleMention>'));
            if(message.member.roles.highest.position <= roleMention.position)return message.reply('Ese rol está más alto que tu rol o tiene la misma posición.');
            if(!message.guild.roles.cache.has(roleMention.id))return message.reply('Este server no tiene ningún rol con esa id.');
            _guild.moderation.dataModeration.muterole = roleMention.id;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `El rol \`${roleMention.name}\` ha sido establecido con éxito.` });
        }catch(err) {}
	},
};