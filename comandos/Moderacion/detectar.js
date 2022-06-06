const Discord = require('discord.js-light');
const Malicious = require('../../schemas/maliciousSchema');

module.exports = {
	nombre: 'detectar',
	category: 'moderacion',
	premium: false,
	alias: ['detect'],
	description: 'Detecta los miembros maliciosos de tu gremio',
	usage: ['<prefix>detectar'],
	run: async (client, message) => {
		if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send('Necesito permiso de __Banear Miembros__.');

		await message.guild.fetch();

		let embed = new Discord.MessageEmbed().setColor(0x5c4fff);
		try{
			message.channel.send({ embeds: [ embed.setDescription('<a:sp_loading:805810562349006918> | `Obteniendo usuarios...`') ] }).then(async y => {
				setTimeout(() => {
					y.edit({ embeds: [ embed.setDescription('<a:sp_loading:805810562349006918> | `Comparando datos...`') ] });
					let detectados = [];
					let ifAdminLikeBanThese = [];
					message.guild.members.cache.forEach(async x => {
						let userIsMalicious = await Malicious.findOne({ userId: x.id });
						if(userIsMalicious) {
							if(userIsMalicious.reason) reason = 'Error, debe usar sp!me';
							detectados.push(`<@${x.id}> \`|\` Razón: ${userIsMalicious.reason}`);
							ifAdminLikeBanThese.push(x.id);
						}
					});
					setTimeout(() => {
						if(detectados.length < 1) {
							y.edit({ embeds: [ embed.setDescription('`No se han encontrado usuarios maliciosos.`') ] });
						}
						let cc = 1;
						y.edit({ embeds: [ embed.setDescription(`${ detectados.map(z => `**${cc++} ::** ${z}`).join('\n') }`) ] });

						let moreData = [];
						if(message.guild.explicitContentFilter === 'ALL_MEMBERS') moreData.push('[Punto a favor]: El filtro de contenido explícito está activo para todos los miembros.');
						if(message.guild.mfaLevel > 1) moreData.push('[Punto a favor]: El nivel de MFA es alto.');
						if(message.guild.nsfwLevel != undefined) moreData.push('[Punto a favor]: Nivel de Nsfw apto.');
						if(message.guild.roles.highest.id === message.guild.me.roles.highest.id) moreData.push('[Punto a favor]: Tengo el rol más alto en este gremio.');
						message.channel.send({ embeds: [ new Discord.MessageEmbed().setAuthor('+ Más datos de seguridad (' + moreData.length + '/4 puntos de seguridad):').setDescription(moreData.map(x => '`' + x + '`').join('\n')).setColor(0x0056ff) ] });
					}, 3000);
				}, 2000);
			});
		}
		catch(e) {
			message.channel.send('```' + e + '```');
		}
	},
};