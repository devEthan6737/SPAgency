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
		let LANG = require(`../../LANG/${_guild.configuration.language}.json`);
	
		if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send({ content: LANG.data.permissionsBanMe });
		if(!message.member.permissions.has('MANAGE_MESSAGES'))return message.channel.send(`${LANG.data.permissionsMessages}.`);

        if(!args[0] || isNaN(parseInt(args[0])))return message.channel.send(await dataRequired(LANG.commands.baninfo.message1 + '\n\n' + _guild.configuration.prefix + 'bainfo <userId>'));

		try{
			let x = await message.guild.bans.fetch(args[0]);
			if(!x)return message.channel.send(LANG.commands.baninfo.message2);

			message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(LANG.commands.baninfo.message3[0].replace('<username>', x.user.username).replace('<userBot>', x.user.bot? LANG.commands.baninfo.message3[1] : LANG.commands.baninfo.message3[2]).replace('<reason>', x.reason ?? LANG.commands.baninfo.message3[3])) ] });
		}catch(err) {
			return message.channel.send(LANG.commands.baninfo.message4);
		}
	},
};