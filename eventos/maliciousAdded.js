const Discord = require('discord.js-light');
const ms = require('ms');

module.exports = async (client, malicious) => {
    await client.users.fetch(malicious.userId);
    
    client.channels.cache.get('923713979598114877').send({
        embeds: [
            new Discord.MessageEmbed().setColor(0x5c4fff).setDescription(`Se ha agregado un nuevo usuario malicioso.\n**${client.users.cache.get(malicious.userId).tag}** con la razón **${malicious.reason}**.\nSu castigo terminará en **${ms(malicious.punishment - Date.now())}**.\nLa prueba solo se puede mostrar cuando el usuario escribe \`sp!me\`.\n\n**__Propulsado por UBFB.__**`)
        ]
    });

}