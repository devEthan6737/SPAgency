const Discord = require('discord.js-light');
const { intelligentSOS, fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, channel) => {
    let _guild = await fecthDataBase(client, channel.guild, false);
    if(!_guild)return;

    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    channel.guild.fetchAuditLogs({ type: 'UPDATE_CHANNEL' }).then(async logs => {
        let prsn = logs.entries.first().executor;

        if(_guild.configuration.whitelist.includes(prsn.id))return; // Whitelist.

        try{
            if(channel.guild.me.permissions.has('BAN_MEMBERS')) {

                // Antiraid:
                if(_guild.protection.antiraid.enable == true) {
                    let cache = await client.super.cache.get(channel.guild.id);

                    if(cache.amount >= 3) {
                        
                        await channel.guild.members.ban(prsn, { reason: 'Raid.' }).catch(e => {});
                        if(prsn.bot == true) {
                            if(_guild.protection.antiraid.saveBotsEntrities) {
                                if(_guild.protection.antiraid.saveBotsEntrities._bot === prsn.id) {
                                    channel.guild.members.ban(_guild.protection.antiraid.saveBotsEntrities.authorOfEntry).catch();
                                    if(_guild.protection.intelligentSOS.enable == true) {
                                        await intelligentSOS(_guild, client, 'Canales creados');
                                    }
                                }
                            }
                        }
                        
                    }else{
                        client.super.cache.up(channel.guild.id, cache);
                        
                        setTimeout(async () => {
                            client.super.cache.delete(channel.guild.id);
                        }, 10000);
                    }
                }
                
                // Raidmode:
                if(_guild.protection.raidmode.enable == true) {
                    await channel.guild.members.ban(prsn, { reason: 'Raidmode.' }).catch(e => {});
                }
            }
        }catch(err) {}

    }).catch(err => {});
}
