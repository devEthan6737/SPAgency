const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { intelligentSOS, fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, role) => {
    
    try{
        let _guild = await fecthDataBase(client, role.guild, false);
        if(!_guild)return;
        let LANG = require(`../LANG/${_guild.configuration.language}.json`);

        role.guild.fetchAuditLogs({ type: 'DELETE_ROLE' }).then(async logs => {
            let prsn = logs.entries.first().executor;

            // Logs:
            try{
                if(_guild.configuration.logs[0]) {
                    client.channels.cache.get(_guild.configuration.logs[0]).send({ content: `\`LOG:\` ${LANG.events.roleDelete.logMessage1}.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(prsn.tag, prsn.displayAvatarURL()).addField(`${LANG.events.roleDelete.logMessage1}:`, `\`${role.name} (${role.id})\``, true) ] }).catch(err => {});
                }
            }catch(err) {
                client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (roleDelete): \`${err}\`` }).catch(() => {});
                _guild.configuration.logs = [];
                updateDataBase(client, role.guild, _guild, true);
            }

            if(_guild.configuration.whitelist.includes(prsn.id))return; // Whitelist.

            // Antiraid:
            if(role.guild.me.permissions.has('BAN_MEMBERS')) {
                if(_guild.protection.antiraid.enable == true) {
                    let cache = await client.super.cache.get(role.guild.id);

                    if(cache.amount >= 3) {

                        await role.guild.members.ban(prsn, { reason: 'Raid.' }).catch(e => {});
                        if(prsn.bot == true) {
                            if(_guild.protection.antiraid.saveBotsEntrities) {
                                if(_guild.protection.antiraid.saveBotsEntrities._bot === prsn.id) {
                                    role.guild.members.ban(_guild.protection.antiraid.saveBotsEntrities.authorOfEntry).catch();
                                    if(_guild.protection.intelligentSOS.enable == true) {
                                        await intelligentSOS(_guild, client, 'Roles borrados');
                                    }
                                }
                            }
                        }

                    }else{
                        client.super.cache.up(role.guild.id, cache);

                        setTimeout(() => {
                            client.super.cache.delete(role.guild.id);
                        }, 10000);
                    }
                }
            }

            // Raidmode
            if(_guild.protection.raidmode.enable == true) {
                if(role.guild.me.permissions.has('BAN_MEMBERS')) {
                    await role.guild.members.ban(prsn, { reason: 'Raidmode.' }).catch(e => {});
                }
            }

        }).catch(err => {});

    }catch(e) {}
}