const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js');
const { fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, member) => {
    let _guild = await fecthDataBase(client, member.guild, false);
    if(!_guild)return;
    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    // Logs:
    try{
        if(_guild.configuration.logs[0]) {
            client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.guildMemberRemove.logMessage}.`, embeds: [ new Discord.EmbedBuilder().setColor(0x0056ff).setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() }).addFields({ name: `${LANG.events.guildMemberRemove.author}:`, value: `\`${member.user.username} (${member.user.id})\``, inline: true }) ] }).catch(err => {});
        }
    }catch(err) {
        client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (guildMemberRemove): \`${err}\`` }).catch(() => {});
        _guild.configuration.logs = [];
        updateDataBase(client, member.guild, _guild, true);
    }

}