const Discord = require('discord.js-light');
const { intelligentSOS, fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, channel) => {
    let _guild = await fecthDataBase(client, channel.guild, false);
    if(!_guild)return;

    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    channel.guild.fetchAuditLogs({ type: 'CREATE_CHANNEL' }).then(async logs => {
        let prsn = logs.entries.first().executor;

        // Logs:
        try{
            if(_guild.configuration.logs[0]) {
                client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.channelCreate.log_channelCreate}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(prsn.tag, prsn.displayAvatarURL()).addField(`${LANG.events.channelCreate.log_channelCreate}:`, `\`${channel.name} (${channel.id})\``, true) ] }).catch(err => {});
            }
        }catch(err) {
            client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (channelCreate): \`${err}\`` }).catch(() => {});
            _guild.configuration.logs = [];
            updateDataBase(client, channel.guild, _guild, true);
        }

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