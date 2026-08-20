const Discord = require('discord.js');

module.exports = async (client, malicious) => {
    await client.users.fetch(malicious.userId);

    client.channels.cache.get(process.env.BOT_PRIVATE_LOGS).send({
        embeds: [
            new Discord.EmbedBuilder().setColor(0x5c4fff).setDescription(`Se ha eliminado un usuario malicioso (**${client.users.cache.get(malicious.userId).tag}**).\nLa prueba de su razón sigue en la base de datos, y se le han agregado antecedentes para mantener el control.\n\n**__Propulsado por UBFB.__**`)
        ]
    });

}
