const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const _sugerencia = new Discord.MessageEmbed().setColor(0x0056ff);

module.exports = {
    nombre: "sugerencia",
    category: "Otros",
    premium: false,
    alias: ['suggest'],
    description: "¿Alguna sugerencia sobre la agencia?",
    usage: ['<prefix>sugerencia <message>'],
    run: async (client, message, args, _guild) => {
        if(!args[0])return message.reply(await dataRequired('No has especificado el mensaje de la sugerencia.\n\n' + _guild.configuration.prefix + 'sugerencia <message>'));

        message.channel.send({ content: 'Estás a punto de enviar ese mensaje a los agentes de SP Agency (Quiere decir que el personal de la agencia lo leerá).\n\nPara continuar escribe `enviar`' });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', async m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {                    
                if(`${m.content}`.toLowerCase() == 'enviar') {
                    _sugerencia.setDescription(args.join(' ')).setTitle('Sugerencia enviada al soporte de SPA.');
                    message.reply({ embeds: [ _sugerencia ], ephemeral: true });
                    client.channels.cache.get('782712586519969792').send({ embeds: [ _sugerencia.setTitle('Sugerencia.').setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL()).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL) ] });
                    collector.stop();
                }else {
                    message.channel.send({ content: 'Entendido, he detenido el comando.' });
                    collector.stop();
                }
            }
        });
    }
}