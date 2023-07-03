const Discord = require('discord.js-light');
const { pulk, fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, message) => {
    if(!message.guild)return;
    if(!message.guild.available)return;
    if(message.channel.type === 'dm') return;
    if(message.webhookID)return;
    if(!message.author || !message.author.id)return;
    if(message.partial) await message.fetch();

    let _guild = await fecthDataBase(client, message.guild, false);
    if(!_guild)return;
    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    if(!await client.super.cache.has(message.guild.id)) client.super.cache.setGuildBase(message.guild.id);
    let cache = client.super.cache.get(message.guild.id);

    try{
        // Logs:
        if(_guild.configuration.logs[0]) {
            if(!message.member.permissions.has('MANAGE_MESSAGES') && _guild.moderation.dataModeration.events.ghostping && message.mentions.members.first()) {
                // Ghostping
                client.channels.cache.get(_guild.configuration.logs[0]).send({ content: '`LOG:` Ghostping detectado (Mensaje borrado).', embeds: [
                    new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(`${message.author.username}`, `${message.author.displayAvatarURL({ })}`).setDescription(`${message.content ?? '> `Sin contenido en el mensaje.`'}`).setImage(message.attachments.size > 0? (message.attachments.first()).proxyURL : 'https://asd.com/')
                ] });

                if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.ghostping == true) {
                    await automoderator(client, _guild, message, 'Menciones fantasmas.');
                }
            }else client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.messageDelete.logMessage1}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(message.author.tag, message.author.displayAvatarURL()).setDescription(message.content).addField(`${LANG.events.messageDelete.logMessage2}:`, `<#${message.channel.id}>`, true).addField('Bot:', `\`${message.author.bot}\``, true) ] }).catch(err => {});
        }

        updateDataBase(client, message.guild, _guild, true);
        client.super.cache.post(message.guild.id, cache);
    }catch(err) {}
}
