// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const Malicious = require('../../schemas/maliciousSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'rmalicious',
	category: 'staff',
	premium: false,
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');

		let roles = await dev.get(`${message.author.id}.roles`);
		if(!roles.includes('824583706257129483'))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Co-Director.`');

		let txt = message.content.slice(_guild.configuration.prefix.length + 10).trim().split('\n');
		if(!args.join(' '))return message.reply('Debes escribir la id del usuario que desactivar de la lista negra.');
		let usersData = await Malicious.findOne({ userId: txt[0] });
		if(!usersData || !usersData.isMalicious)return message.reply('Esa persona no es maliciosa.');

        usersData.isMalicious = false;

        if(!usersData.record || !`${usersData.record}`.includes(usersData.reason)) {
            if(usersData.record) {
                usersData.record += ', ' + `${usersData.reason}`.toLowerCase();
            }else{
                usersData.record = usersData.reason;
            }
        }

        usersData.save();

		let embed = new Discord.MessageEmbed()
			.setAuthor('Usuario añadido a antecedentes, eliminado de la lista negra.')
			.setDescription(`ID: **${usersData.userId}**\nRazón: \`${usersData.reason}\`\nPrueba: **${usersData.proof}**`)
			.setColor('5c4fff');
		message.channel.send({ embeds: [ embed ] });

		client.ubfb.post({ // No es necesario quitarlo, la api no responderá si el token no tiene permisos.
			token: await (client.ubfb.client().then(cl => cl.token())),
			event: true,
			eventToEmit: 'maliciousRemoved',
			data: `${usersData.userId}`,
		});
	},
};