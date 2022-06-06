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

    try{
        // Logs:
        if(_guild.configuration.logs[0]) {
            client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.messageDelete.logMessage1}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(message.author.tag, message.author.displayAvatarURL()).setDescription(message.content).addField(`${LANG.events.messageDelete.logMessage2}:`, `<#${message.channel.id}>`, true).addField('Bot:', `\`${message.author.bot}\``, true) ] }).catch(err => {});
        }

        // Snipes:
        if(!_guild.moderation.dataModeration.snipes) _guild.moderation.dataModeration.snipes = {
            editeds: [],
            deleteds: []
        }
        if(_guild.moderation.dataModeration.snipes.deleteds.length == 5) {
            _guild.moderation.dataModeration.snipes.deleteds = await pulk(_guild.moderation.dataModeration.snipes.deleteds, _guild.moderation.dataModeration.snipes.deleteds[0]);
            _guild.moderation.dataModeration.snipes.deleteds.push({
                tag: message.author.tag,
                displayAvatarURL: message.author.displayAvatarURL(),
                content: message.content,
                at: `${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`
            });
        }else{
            _guild.moderation.dataModeration.snipes.deleteds.push({
                tag: message.author.tag,
                displayAvatarURL: message.author.displayAvatarURL(),
                content: message.content,
                at: `${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`
            });
        }

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
    }catch(err) {}
}