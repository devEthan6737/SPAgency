// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'scomandos',
	category: 'Staff',
	premium: false,
	alias: ['scmds', 'scommands'],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
        if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
		message.channel.send({ embeds: [
            new Discord.MessageEmbed().setColor(0x0056ff).setTitle('Reclutas').setDescription('`mi`, `password`, `queue`'),
            new Discord.MessageEmbed().setColor(0x0056ff).setTitle('Agente Oficial').setDescription('`sguild`, `send`, `dbsearch`'),
            new Discord.MessageEmbed().setColor(0x0056ff).setTitle('Supervisor').setDescription('`skick`, `vsubmit`'),
            new Discord.MessageEmbed().setColor(0x0056ff).setTitle('Alto mando').setDescription('`generate`, `sban`'),
            new Discord.MessageEmbed().setColor(0x0056ff).setTitle('Co-Director').setDescription('`malicious`, `bloquser`, `bloqguild`'),
            new Discord.MessageEmbed().setColor(0x0056ff).setTitle('Director').setDescription('`rmalicious`, `unbloquser`, `unbloquser`, `eval`, `giveadmin`, `ubfbcode`'),
        ] });
	},
};