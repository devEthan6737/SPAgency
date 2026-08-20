const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js');
const { fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, member) => {
    let _guild = await fecthDataBase(client, member.guild, false);
    if(!_guild)return;

    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    member.guild.fetchAuditLogs({ type: 'UNBAN' }).then(async logs => {
        let prsn = logs.entries.first();

        // Logs:
        try{
            if(_guild.configuration.logs[0]) {
                client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.guildBanRemove.log_banRemoved}.`, embeds: [ new Discord.EmbedBuilder().setColor(0x0056ff).setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() }).addFields({ name: `${LANG.events.guildBanRemove.log_author}:`, value: `\`${prsn.executor.username} (${prsn.executor.id})\``, inline: true }).addFields({ name: `${LANG.events.guildBanRemove.log_unbannedPerson}:`, value: `\`${prsn.target.username} (${prsn.target.id})\``, inline: true }) ] }).catch(err => {});
            }
        }catch(err) {
            client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (guildBanRemove): \`${err}\`` }).catch(() => {});
            _guild.configuration.logs = [];
            updateDataBase(client, member.guild, _guild, true);
        }

        if(_guild.configuration.whitelist.includes(prsn.id))return; // Whitelist.

    }).catch(err => {});
}