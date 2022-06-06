const Discord = require('discord.js-light');
const antiRF = require('../../schemas/antiRF_Schema');
const { dataRequired, fecthUsersDataBase } = require('../../functions');
const _bug = new Discord.MessageEmbed().setColor(0x0056ff);

module.exports = {
    nombre: "bug",
    category: "Otros",
    premium: false,
    alias: [],
    description: "¿Alguna bug sobre la agencia?",
    usage: ['<prefix>bug <message>'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!args[0])return message.reply(await dataRequired('' + LANG.commands.others.bug.message1 + '.\n\n' + _guild.configuration.prefix + 'bug <message>'));
        
        message.channel.send({ content: `${LANG.commands.others.bug.message2}.` });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', async m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {                    
                if(`${m.content}`.toLowerCase() == 'enviar') {
                    _bug.setDescription(args.join(' ')).setTitle(`${LANG.commands.others.bug.message3}.`);
                    message.reply({ embeds: [ _bug ], ephemeral: true });
                    client.channels.cache.get('782712586519969792').send({ embeds: [ _bug.setTitle('Bug.').setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL()).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL) ] });
                    collector.stop();
                }else {
                    message.channel.send({ content: `${LANG.commands.others.bug.message4}.` });
                    collector.stop();
                }
            }
        });

        let user = await fecthUsersDataBase(client, message.author);
        if(user && user.achievements.data.bugs >= 2 && !user.achievements.array.includes('Cazador de bugs.')) {
            message.channel.send({ content: 'Acabas de obtener un logro, mira tu perfil.' });
            user.achievements.array.push('Cazador de bugs.');
            user.save();
        }
    }
}