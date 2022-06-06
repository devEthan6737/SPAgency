// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'sban',
	category: 'Staff',
	premium: false,
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
        if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send('Necesito permiso de __Banear Miembros__.');

        let roles = await dev.get(`${message.author.id}.roles`);
		if(!roles.includes('835944342652059668'))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Alto mando.`');

		return message.reply('Este comando quedó obsoleto en la v6.1');
	},
};