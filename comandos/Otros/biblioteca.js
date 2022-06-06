const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const embed = new Discord.MessageEmbed().setColor('5c4fff');

module.exports = {
	nombre: 'biblioteca',
	category: 'Otros',
	premium: false,
	alias: ['libro'],
	description: 'Una biblioteca como otra cualquiera.',
	usage: ['<prefix>biblioteca <commandName>'],
	run: async (client, message, args, _guild) => {
		let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!args.join(' '))return message.reply(await dataRequired('' + LANG.commands.others.biblioteca.message1 +'.\n\n' + _guild.configuration.prefix + 'biblioteca <commandName>'));
		const cmd = client.comandos.get(args[0]) || client.comandos.find((f) => f.alias.includes(args[0]));
		try{
            let usage = `${cmd.usage}`.split('<prefix>').join(_guild.configuration.prefix);
			let p;
			if(cmd.premium == false) {
				p = 'No';
			}else{
				p = 'Sí';
			}
			if(cmd.alias.length > 0) {
				const array = cmd.alias;
				message.reply({ content: '`[]` = ' + LANG.commands.others.biblioteca.message2 + '.\n`<>` = ' + LANG.commands.others.biblioteca.message3 + '.\n`{}` = ' + LANG.commands.others.biblioteca.message4 + '.', embeds: [ embed.setDescription('Comando `' + cmd.nombre + '`\nCategoría: `' + cmd.category + '`\nPremium: `' + p + '`\nAlias: `' + array.map(x => `${x}`).join(', ') + '`\n\nUso: `' + usage + '`\n\n```md\n# ' + cmd.description + '```') ] });
			}else{
				message.reply({ content: '`[]` = ' + LANG.commands.others.biblioteca.message2 + '.\n`<>` = ' + LANG.commands.others.biblioteca.message3 + '.\n`{}` = ' + LANG.commands.others.biblioteca.message4 + '.', embeds: [ embed.setDescription('Comando `' + cmd.nombre + '`\nCategoría: `' + cmd.category + '`\nPremium: `' + p + '`\nAlias: `Ninguno.`\n\nUso: `' + usage + '`\n\n```md\n# ' + cmd.description + '```') ] });
			}
		}catch(e) {
			message.channel.send(`${LANG.commands.others.biblioteca.message5}.`);
		}
	},
};