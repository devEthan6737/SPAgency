const { dataRequired } = require('../../functions');

module.exports = {
	nombre: 'hackban',
	category: 'Moderación',
	premium: false,
	alias: ['banid'],
	description: 'Banea a un usuario que no esté dentro de tu gremio.',
	usage: ['<prefix>hackban <userId>'],
	run: async (client, message, args, _guild) => {
		if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send('Necesito permiso de __Banear Miembros__.');
		if(!message.member.permissions.has('BAN_MEMBERS'))return message.channel.send('Necesitas permisos de __Banear Miembros__.');
        if(!args[0])return message.reply(await dataRequired('No has escrito la id de la persona.\n\n' + _guild.configuration.prefix + 'hackban <userId>'));
		if(isNaN(args[0]))return message.channel.send('Eso no era una id.');
		try{
            let miembro;
            miembro = await client.users.cache.get(args[0]);
            if(!miembro) {
                miembro = await client.users.fetch(args[0]);
            }
            miembro.send(`Has sido baneado de \`${message.guild.name}\`.`).catch(err => {});
			message.guild.members.ban(miembro.id).catch(err => {
                return message.channel.send('No he podiddo banear al usuario.');
            });
			message.reply(`\`${miembro.tag}\` ha sido baneado de este servidor.`);
		}
		catch(e) {
			message.channel.send('```' + e + '```');
		}
	},
};