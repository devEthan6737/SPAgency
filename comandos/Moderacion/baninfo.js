const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');

module.exports = {
	nombre: 'baninfo',
	category: 'Moderación',
	premium: false,
	alias: [],
	description: 'Obtén la información de un baneo en tu servidor.',
	usage: ['<prefix>baninfo <userId>'],
	run: async (client, message, args, _guild) => {
		if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send('Necesito permiso de __Banear Miembros__.');
		if(!message.member.permissions.has('MANAGE_MESSAGES')) return message.channel.send('Necesitas permiso de __Gestionar Mensajes__.');

        if(!args[0] || isNaN(parseInt(args[0])))return message.channel.send(await dataRequired('Es necesario escribir la id del usuario baneado.\n\n' + _guild.configuration.prefix + 'bainfo <userId>'));

		try{
			let x = await message.guild.bans.fetch(args[0]);
			if(!x)return message.channel.send({ content: 'Ese usuario no está baneado o hubo un error.' });

			message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`Tag: \`${x.user.username}#${x.user.discriminator}\`\nBot: \`${x.user.bot? 'Es un bot.' : 'No es un bot.'}\`\nRazón del baneo: \`${x.reason ?? 'Sin razón.'}\``) ] });
		}catch(err) {
			return message.channel.send({ content: 'Ese usuario no está baneado.' });
		}
	},
};