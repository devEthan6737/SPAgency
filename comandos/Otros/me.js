const Discord = require('discord.js-light');
const Malicious = require('../../schemas/maliciousSchema');
const ms = require('ms');

module.exports = {
    nombre: "me",
    category: "Otros",
    premium: false,
    alias: [],
    description: "Obtén información si eres malicioso o si un usuario lo és.",
    usage: ['<prefix>me [userId]'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        let malicious;
        if(args[0]) {
            malicious = await client.ubfb.getUser(args[0]);
            if(malicious && malicious.isMalicious) {
                if(malicious.record)return message.reply({ content: '<a:sp_si:805810572599099413> | `' + LANG.commands.others.me.message1 + ': ' + malicious.record + '.`' });
                let embed = new Discord.MessageEmbed()
                    .setAuthor(`${LANG.commands.others.me.message2}.`)
                    .setFooter(`${LANG.commands.others.me.message3}.`).setColor(0x5c4fff);
                if(malicious.punishment - Date.now() < 0) {
                    embed.setDescription(`ID: **${args[0]}**\n${LANG.commands.others.me.message4}: \`${malicious.reason}\`\n${LANG.commands.others.me.message5} \`${ms(Math.abs(malicious.dates.punishment - Date.now()))}\`.`);
                }else{
                    embed.setDescription(`ID: **${args[0]}**\n${LANG.commands.others.me.message4}: \`${malicious.reason}\`\n${LANG.commands.others.me.message6} \`${ms(malicious.dates.punishment - Date.now())}\`.`);
                }
                message.reply({ embeds: [ embed ] });
                if(malicious.record) {
                    message.channel.send({ content: `${LANG.commands.others.me.message7}: \`${malicious.record}\`` });
                }
            }else if(malicious && !malicious.isMalicious)return message.reply(LANG.commands.others.me.message15);
            else{
                message.reply({ content: '<a:sp_si:805810572599099413> | `' + LANG.commands.others.me.message8 + '.`' });
                if(malicious && malicious.record) {
                    message.channel.send({ content: `${LANG.commands.others.me.message9}: \`${malicious.record}\`` });
                }
            }
        }else{
            malicious = await client.ubfb.getUser(message.author.id);
            if(malicious && malicious.isMalicious) {
                if(malicious.record)return message.reply({ content: '<a:sp_si:805810572599099413> | `' + LANG.commands.others.me.message10 + ': ' + malicious.record + '.`' });
                let embed = new Discord.MessageEmbed()
                    .setAuthor(`${LANG.commands.others.me.message2}.`)
                    .setFooter(`${malicious.proof}`)
                    .setImage(malicious.proof).setColor(0x5c4fff);
                if(malicious.punishment - Date.now() < 0) {
                    embed.setDescription(`ID: **${message.author.id}**\n${LANG.commands.others.me.message4}: \`${malicious.reason}\`\n${LANG.commands.others.me.message11} \`${ms(Math.abs(malicious.dates.punishment - Date.now()))}\`.`);
                }else{
                    embed.setDescription(`ID: **${message.author.id}**\n${LANG.commands.others.me.message4}: \`${malicious.reason}\`\n${LANG.commands.others.me.message12} \`${ms(malicious.dates.punishment - Date.now())}\`.`);
                }
                message.reply({ embeds: [ embed ] });
                if(malicious.record) {
                    message.channel.send({ content: `${LANG.commands.others.me.message13}: \`${malicious.record}\`` });
                }
            }else if(malicious && !malicious.isMalicious)return message.reply(LANG.commands.others.me.message16);
            else{
                message.reply({ content: '<a:sp_si:805810572599099413> | `' + LANG.commands.others.me.message14 + '.`' });
                if(malicious && malicious.record) {
                    message.channel.send({ content: `${LANG.commands.others.me.message9}: \`${malicious.record}\`` });
                }
            }
        }
    }
}
