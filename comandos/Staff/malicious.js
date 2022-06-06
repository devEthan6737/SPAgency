// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const razones = ['Raider', 'Miembro de una squad', 'Dox', 'Bot raider', 'Spam al md', 'Flood', 'Suplantar identidad', 'Nsfw', 'Toxicidad', 'Amenaza', 'Estafa', 'Infectar usuarios', 'Multicuenta maliciosa', 'Infiltración', 'Plagio', 'Generadores uncheked', 'Uso de tools', 'Incitación a lo repulsivo', 'Violación del Tos', 'Selfbot', 'Abuso de SP Agency', 'DDos'];
const Discord = require('discord.js-light');
const Malicious = require('../../schemas/maliciousSchema');
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

		let txt = message.content.slice(_guild.configuration.prefix.length + 9).trim().split('\n');
		if(!args.join(' '))return message.reply('Orden para añadir un usuario malicioso: ```' + _guild.configuration.prefix + 'malicious <userID>\n<reason>\n<proofToSentence>```');
		let usersData = await Malicious.findOne({ userId: txt[0] });
		if(usersData && usersData.isMalicious)return message.reply('Esa persona ya ha sido añadida.');
		if(!razones.includes(txt[1]))return message.channel.send('Esa razón no está disponible.');
		if(!txt[2])return message.channel.send('No se ha escrito la prueba.');

		if(!usersData) {
			let newMalicious = new Malicious({
				userId: txt[0],
				isMalicious: true,
				reason: txt[1],
				proof: txt[2],
				punishment: Date.now() + 7889400000,
				appealStatus: 'Sin estado.',
			});
			newMalicious.save();
		}else{
			usersData.isMalicious = true;
			usersData.reason = txt[1];
			usersData.proof = txt[2];
			usersData.punishment = Date.now() + 7889400000;
			usersData.appealStatus = 'Sin estado.';
			usersData.save();
        }

		let embed = new Discord.MessageEmbed()
			.setAuthor('Nuevo Usuario En Lista Negra.')
			.setDescription(`ID: **${txt[0]}**\nRazón: \`${txt[1]}\`\nPrueba: **${txt[2]}**`)
			.setColor('5c4fff');
		message.channel.send({ embeds: [ embed ] });

		client.ubfb.post({ // No es necesario eliminarlo, la api no responderá si el token no tiene permisos.
			token: await (client.ubfb.client().then(cl => cl.token())),
			event: true,
			eventToEmit: 'maliciousAdded',
			data: txt[0],
		});
	},
};