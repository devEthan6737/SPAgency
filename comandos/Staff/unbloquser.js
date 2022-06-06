// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const antiRF = require('../../schemas/antiRF_Schema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'unbloquser',
	category: 'staff',
	premium: false,
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');

		let roles = await dev.get(`${message.author.id}.roles`);
		if(!roles.includes('824583706257129483'))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Director.`');

		if(!args[0])return message.reply('Debes escribir la id del usuario que deseas desbloquear.');

        let user = await antiRF.findOne({ user: args[0] });

        if(!user)return message.channel.send({ content: 'El usuario no está en la base de datos.' });

        user.isBloqued = false;

        user.save();

        message.channel.send({ content: `El usuario ha sido desbloqueado.` });
	},
};