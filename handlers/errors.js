require('dotenv').config();
const { MessageEmbed } = require('discord.js-light');

module.exports = (err, client) => {
    if(process.env.BOT_PRIVATE_LOGS) return console.error('No has especificado un canal de logs privados en .env');
    client.channels.cache.get(process.env.BOT_PRIVATE_LOGS).send({
        embeds: [new MessageEmbed().setColor('RED').setDescription('```js\n' + err + '\n```')]
    }).catch(() => { console.error('No he podido mandar el embed al canal de logs privados del bot. Comprueba los ajustes del canal.') });
};