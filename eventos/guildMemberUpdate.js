const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { fecthDataBase } = require('../functions');

module.exports = async (client, member) => {
    let _guild = await fecthDataBase(client, member.guild, false);
    if(!_guild)return;
    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    member.guild.fetchAuditLogs({ type: 'UPDATE_MEMBER' }).then(async logs => {
        let prsn = logs.entries.first();

        // Logs:
        try{
            if(_guild.configuration.logs[0]) {
                if(prsn.changes[0].key == '$remove') {
                    client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.guildMemberUpdate.roleRemoved}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`\`${LANG.events.guildMemberUpdate.roleDelete}:\` __${prsn.changes[0].new[0].name}__\n\`${LANG.events.guildMemberUpdate.roleDeleteBy}:\` __${prsn.executor.username}__\n\`${LANG.events.guildMemberUpdate.roleDeleteTo}:\` __${prsn.target.username}__\n`) ] }).catch(err => {});
                }else if(prsn.changes[0].key == '$add') {
                    client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.guildMemberUpdate.roleCreated}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`\`${LANG.events.guildMemberUpdate.roleAdded}:\` __${prsn.changes[0].new[0].name}__\n\`${LANG.events.guildMemberUpdate.roleAddedBy}:\` __${prsn.executor.username}__\n\`${LANG.events.guildMemberUpdate.roleAddedTo}:\` __${prsn.target.username}__\n`) ] }).catch(err => {});
                }
            }
        }catch(err) {}

    }).catch(err => {});

}