const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { pulk, fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, message) => {
    if (!message.guild)return;
    if (!message.guild.available)return;
    if (message.channel.type === 'dm') return;
    if (message.webhookID)return;
    try{
        if (!message.author) message.author.fetch(true).catch(err => {});
    }catch(err) {}

    if (!message.author || !message.author.id)return;

    let _guild = await fecthDataBase(client, message.guild, false);
    if(!_guild)return;
    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    if(!await client.super.cache.has(message.guild.id)) client.super.cache.setGuildBase(message.guild.id);
    let cache = client.super.cache.get(message.guild.id);

    try{
        // Logs:
        if(_guild.configuration.logs[0]) {
            client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.messageDelete.logMessage1}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(message.author.tag, message.author.displayAvatarURL()).setDescription(message.content).addField(`${LANG.events.messageDelete.logMessage2}:`, `<#${message.channel.id}>`, true).addField('Bot:', `\`${message.author.bot}\``, true) ] }).catch(err => {});
        }

        // Snipes:
        if(cache.snipes.deleteds.length == 5) {
            cache.snipes.deleteds = await pulk(cache.snipes.deleteds, cache.snipes.deleteds[0]);
            cache.snipes.deleteds.push({
                tag: message.author.tag,
                displayAvatarURL: message.author.displayAvatarURL(),
                content: message.content.length? message.content : '> `Sin contenido del mensaje.`',
                at: `${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`,
                attachments: {
                    firstAttachment: message.attachments.size > 0? (message.attachments.first()).proxyURL : undefined,
                    rest: message.attachments.size > 1? message.attachments.size - 1 : 0
                }
            });
        }else cache.snipes.deleteds.push({
            tag: message.author.tag,
            displayAvatarURL: message.author.displayAvatarURL(),
            content: message.content.length? message.content : '> `Sin contenido del mensaje.`',
            at: `${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`,
            attachments: {
                firstAttachment: message.attachments.size > 0? (message.attachments.first()).proxyURL : undefined,
                rest: message.attachments.size > 1? message.attachments.size - 1 : 0
            }
        });

        if(!message.member.permissions.has('MANAGE_MESSAGES')) {

            // Ghostping:
            if(_guild.moderation.dataModeration.events.ghostping && message.mentions.members.first()) {
                if(message.attachments.size == 1) {
                    message.attachments.forEach(x => {
                        message.channel.send({ content: 'Ghostping detectado (Mensaje borrado).', embeds: [
                            new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(`${message.author.username}`, `${message.author.displayAvatarURL({ })}`).setDescription(`${message.content ?? '`- SIN CONTENIDO EN EL MENSAJE`'}`).setImage(x.proxyURL)
                        ] });
                    });
                }else{
                    message.channel.send({ content: 'Ghostping detectado (Mensaje borrado).', embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(`${message.author.username}`, `${message.author.displayAvatarURL({ })}`).setDescription(`${message.content ?? 'Error.'}`)
                    ] });
                }

                if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.ghostping == true) {
                    await automoderator(client, _guild, message, 'Menciones fantasmas.');
                }
            }

        }

        updateDataBase(client, message.guild, _guild, true);
        client.super.cache.post(message.guild.id, cache);
    }catch(err) {}
}