// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const antiRF = require('../../schemas/antiRF_Schema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'bloquser',
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

		if(!args[0])return message.reply('Debes escribir la id del usuario que deseas bloquear.');

        let user = await antiRF.findOne({ user: args[0] });

        if(!user)return message.channel.send({ content: 'El usuario no está en la base de datos.' });
        user.isBloqued = true;
        user.save();

		user = await client.users.cache.get(args[0]) || await client.users.fetch(args[0]);
		/*Cambia este mensaje*/ user.send({ content: 'Por la presente, su cuenta se declara bloqueada (permanentemente en un principio) por incumplir nuestros __términos del servicio/usuario__.\n\nEsto quiere decir que no podrá añadir al bot a su servidor y cualquier tipo de soporte en el servicio será suprimido. Tampoco podrá hacer uso del bot y no podrá ingresar en servidores que el servicio tiene en común o protege.\n\nAtentamente,\nDirección & Moderación de SP Agency.' }).catch(err => {});

        message.channel.send({ content: `El usuario ha sido bloqueado.` });
	},
};