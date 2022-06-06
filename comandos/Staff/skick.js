// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'skick',
	category: 'Staff',
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        let staff = await dev.get(`${message.author.id}`);
		if(staff.roles.includes('921841473312419861')) {
            
            return message.reply('Este comando quedó obsoleto en la v6.1.2');
        }else message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Supervisor.`');
	},
};