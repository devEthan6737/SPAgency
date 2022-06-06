const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { intelligentSOS, updateDataBase, fecthDataBase } = require('../functions');

module.exports = async (client, member) => {
    let _guild = await fecthDataBase(client, member.guild, false);
    if(!_guild)return;

    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    member.guild.fetchAuditLogs({ type: 'BAN' }).then(async logs => {
        let prsn = logs.entries.first();

        // Logs:
        try{
            if(_guild.configuration.logs[0]) {
                client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.guildBanAdd.log_banAdd}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(member.guild.name, member.guild.iconURL()).addField(`${LANG.events.guildBanAdd.log_author}:`, `\`${prsn.executor.username} (${prsn.executor.id})\``, true).addField(`${LANG.events.guildBanAdd.log_bannedPerson}:`, `\`${prsn.target.username} (${prsn.target.id})\``, true) ] }).catch(err => {});        
            }
        }catch(err) {
            client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (guildBanAdd): \`${err}\`` }).catch(() => {});
            _guild.configuration.logs = [];
            updateDataBase(client, member.guild, _guild, true);
        }

        if(_guild.configuration.whitelist.includes(prsn.id))return; // Whitelist.

        // Antiraid:
        if(member.guild.me.permissions.has('BAN_MEMBERS')) {
            if(_guild.protection.antiraid.enable == true) {
                let cache = await client.super.cache.get(member.guild.id);

                if(cache.amount >= 3) {
                    
                    await member.guild.members.ban(prsn, { reason: 'Raid.' }).catch(e => {});
                    if(prsn.bot == true) {
                        if(_guild.protection.antiraid.saveBotsEntrities) {
                            if(_guild.protection.antiraid.saveBotsEntrities._bot === prsn.id) {
                                member.guild.members.ban(_guild.protection.antiraid.saveBotsEntrities.authorOfEntry).catch();
                                if(_guild.protection.intelligentSOS.enable == true) {
                                    await intelligentSOS(_guild, client, 'Baneos masivos');
                                }
                            }
                        }
                    }
                    
                }else{
                    client.super.cache.up(member.guild.id, cache);
                        
                    setTimeout(async () => {
                        client.super.cache.delete(member.guild.id);
                    }, 10000);
                }
            }
        }

        // Raidmode:
        if(_guild.protection.raidmode.enable == true) {
            if(member.guild.me.permissions.has('BAN_MEMBERS')) {
                await member.guild.members.ban(prsn, { reason: 'Raidmode.' }).catch(e => {});
            }
        }

    }).catch(err => {});
}