const ms = require('ms');
const Discord = require('discord.js-light');

module.exports = {
    nombre: "premium",
    category: "Otros",
    premium: false,
    alias: [],
    description: "Canjea u obtén información sobre tu premium.",
    usage: ['<prefix>premium'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        return message.reply({ content: "SPA Code is not ready to use TIBAJS API." });
    }
}
