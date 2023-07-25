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
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!args[0])return message.reply(LANG.commands.others.sugerencia.message1 + await dataRequired('\n\n' + _guild.configuration.prefix + 'sugerencia <message>'));

        message.channel.send(LANG.commands.others.sugerencia.message2);
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', async m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {                    
                if(`${m.content}`.toLowerCase() == 'enviar') {
                    _sugerencia.setDescription(args.join(' ')).setTitle(LANG.commands.others.sugerencia.message3);
                    message.reply({ embeds: [ _sugerencia ], ephemeral: true });
                    client.channels.cache.get(process.env.BOT_PRIVATE_LOGS).send({ embeds: [ _sugerencia.setTitle(LANG.commands.others.sugerencia.message4).setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL()).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL) ] });
                    collector.stop();
                }else {
                    message.channel.send(LANG.commands.others.sugerencia.message5);
                    collector.stop();
                }
            }
        });
    }
}
