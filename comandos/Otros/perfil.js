const Discord = require('discord.js-light');
const ms = require('ms');

module.exports = {
	nombre: 'perfil',
	category: 'Otros',
	premium: false,
	alias: [],
	description: 'Mira los datos de tu perfil.',
	usage: ['<prefix>perfil [json]'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        return message.channel.send({ content: '`Error 007:` SPA Code is not ready to use TIBAJS API.' });
	},
};
