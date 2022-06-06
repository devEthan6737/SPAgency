// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'sguild',
	category: 'Staff',
	premium: false,
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
        if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
		let roles = await dev.get(`${message.author.id}.roles`);
		if(roles.includes('835570094221426750')) {
			try{
				if(args[0] === '824582553243222036' || args[0] === '782308079588343849') { // Son nuestros servidores privados. Cambia las ids, es gracioso.
					message.channel.send({ content: 'No\nte\npases\nde\nlisto' });
					message.channel.send({ content: '<:mario_truco:921835970641408020>' });
					return;
				}
				let guild = client.guilds.cache.get(args[0]);
				if(!guild) return message.channel.send('El bot no está en esta guild.');
				client.guilds.fetch(args[0]);
				let codigo = await guild.channels.cache.filter(m => m.type == 'GUILD_TEXT').random().createInvite();
				if(codigo === undefined) return message.channel.send('Ups, parece que ocurrió un error. Intenta nuevamente');
				let a = client.guilds.cache.get(args[0]);
				message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(a.name, a.iconURL()).setDescription(`[Link](${codigo}) | \`Propietario:\` ${guild.ownerId}`) ] });
			}catch(err) {
				message.channel.send({ content: `${err}` });
			}
		}else message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Agente Oficial.`');
	},
};