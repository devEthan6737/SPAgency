// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const Timers = require('../../schemas/timersSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'unbloqguild',
	category: 'staff',
	premium: false,
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');

		let roles = await dev.get(`${message.author.id}.roles`);
		if(!roles.includes('824583706257129483'))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Director.`');

		if(!args[0])return message.reply('Debes escribir la id del servidor que deseas bloquear.');

        let _timers = await Timers.findOne({ });

        if(!_timers.serversBloqued.includes(args[0]))return message.channel.send({ content: 'El servidor no estaba bloqueado.' });

        _timers.serversBloqued.splice(_timers.serversBloqued.indexOf(args[0]), 1);

        _timers.save();

        let server = client.guilds.cache.get(args[0]);
        if(!server) server = await client.guilds.fetch(args[0]);

        try{
            server.leave().catch(err => {});
        }catch(err) {}
        message.channel.send({ content: `El servidor \`${server.name}\` ha sido bloqueado y he abandonado el servidor.` });
	},
};