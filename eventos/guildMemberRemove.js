const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, member) => {
    let _guild = await fecthDataBase(client, member.guild, false);
    if(!_guild)return;
    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    // Logs:
    try{
        if(_guild.configuration.logs[0]) {
            client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.guildMemberRemove.logMessage}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(member.guild.name, member.guild.iconURL()).addField(`${LANG.events.guildMemberRemove.author}:`, `\`${member.user.username} (${member.user.id})\``, true) ] }).catch(err => {});
        }
    }catch(err) {
        client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (guildMemberRemove): \`${err}\`` }).catch(() => {});
        _guild.configuration.logs = [];
        updateDataBase(client, member.guild, _guild, true);
    }

}