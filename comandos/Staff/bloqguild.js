// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Timers = require('../../schemas/timersSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'malicious',
	category: 'staff',
	premium: false,
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');

		let roles = await dev.get(`${message.author.id}.roles`);
		if(!roles.includes('840665167149662258'))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Co-Director.`');
		if(!roles.includes('824583706257129483') && message.channel.id != "822643058029887530")return message.channel.send('<a:sp_no:805810577448239154> | `Los Co-Directores solo pueden usar este comando en` <#822643058029887530> `.`');

		if(!args[0])return message.reply('Debes escribir la id del servidor que deseas bloquear.');

        let _timers = await Timers.findOne({ });

        if(_timers.serversBloqued.includes(args[0]))return message.channel.send({ content: 'El servidor ya estaba bloqueado.' });

        _timers.serversBloqued.push(args[0]);

        _timers.save();

        let server = await client.guilds.cache.get(args[0]) || await client.guilds.fetch(args[0]);
        if(!server)return message.reply('Servidor no encontrado.');
		let owner = await client.users.cache.get(server.ownerId) || await client.users.fetch(server.ownerId);
		/*Cambia este mensaje*/ owner.send({ content: 'Por la presente, su servidor se declara bloqueado (permanentemente en un principio) por incumplir nuestros __términos del servicio/usuario__.\n\nEsto quiere decir que no podrá añadir al bot a su servidor y no podrá obtener soporte de nuestro personal para su servidor.\n\nAtentamente,\nDirección & Moderación de SP Agency.' }).catch(err => {});

        try{
            server.leave().catch(err => {});
        }catch(err) {}
        message.channel.send({ content: `El servidor \`${server.name}\` ha sido bloqueado y he abandonado el servidor.` });
	},
};