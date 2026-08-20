const Discord = require('discord.js');
const { dataRequired } = require('../../functions');
const _queja = new Discord.EmbedBuilder().setColor(0x0056ff);

module.exports = {
    nombre: "queja",
    category: "Otros",
    premium: false,
    alias: [],
    description: "¿Alguna queja sobre la agencia?",
    usage: ['<prefix>queja <message>'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);
        if(!args[0])return message.reply(await dataRequired('' + LANG.commands.others.queja.message1 +'.\n\n' + _guild.configuration.prefix + 'queja <message>'));

        message.channel.send({ content: '' + LANG.commands.others.queja.message2 + ' `enviar`' });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', async m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {                    
                if(`${m.content}`.toLowerCase() == 'enviar') {
                    _queja.setDescription(args.join(' ')).setTitle('' + LANG.commands.others.queja.message3 + '.');
                    message.reply({ embeds: [ _queja ], ephemeral: true });
                    client.channels.cache.get(process.env.BOT_PRIVATE_LOGS).send({ embeds: [ _queja.setTitle('Queja.').setAuthor({ name: `${message.author.tag}, ${message.author.id}`, iconURL: message.author.displayAvatarURL() }).setFooter({ text: `${message.guild.name}, ${message.guild.id}`, iconURL: message.guild.iconURL }) ] });
                    collector.stop();
                }else {
                    message.channel.send({ content: '' + LANG.commands.others.queja.message4 +'.' });
                    collector.stop();
                }
            }
        });
    }
}
