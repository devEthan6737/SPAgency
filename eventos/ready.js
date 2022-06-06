const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');
const Timers = require('../schemas/timersSchema');
const Guild = require('../schemas/guildsSchema');
const Support = require('../schemas/supportSchema');
const { pulk } = require('../functions');
const ads = require('../ads.json');

module.exports = async (client) => {

    client.guilds.cache.get('824582553243222036').members.fetch();
    await dev.purgeall();

    setTimeout(() => {
        client.guilds.cache.get('824582553243222036').members.cache.forEach(async x => {
            if(x.user.id != '779660400081764393' && x.user.id != '852196003162882068') {
                dev.set(x.user.id, {
                    roles: x._roles,
                    password: Math.floor(Math.random() * 9999999999)
                });
                if(!dev.has('array')) dev.set('array', []);

                let support = await Support.findOne({ fetchStaff: x.user.id });
                if(!support) {
                    dev.push('array', x.user.id);
                }
            }

        });
        setTimeout(async () => {
            let _timers = await Timers.findOne({ });
            let savingDevs = await dev.get('array');
            let newDevArray = [];
            savingDevs.forEach(async x => {
                let gettingDev = await dev.get(x);
                newDevArray.push({
                    userId: x,
                    password: gettingDev.password,
                    roles: gettingDev.roles
                });
            });
            _timers.staff = newDevArray;
            _timers.save();
        }, 10000);
    }, 60000);

    setInterval(async () => {
        client.user.setActivity(`${ads.botStatus.has? ads.botStatus.message : 'https://dash.huguitishosting.com/ !'}`, {
            type: `${ads.botStatus.has? ads.botStatus.type : 'PLAYING'}`
        });

        client.super.cache.purgeAll();

        let _timers = await Timers.findOne({ });
        let count = 0;
        
        for(x of _timers.servers) {
            if(typeof x != 'string')return;
            let _guild = await Guild.findOne({ id: x });
            if(!_guild) {
                _timers.servers = await pulk(_timers.servers, x);
                _timers.save();
                return;
            }
            let LANG = require(`../LANG/${_guild.configuration.language}.json`);

            _guild.moderation.dataModeration.timers.forEach(async i => {
                if(Date.now() > i.endAt) {
                    try{

                        // Timers actions:
                        if(i.action == 'UNBAN') {
                            
                            client.guilds.cache.get(x).members.unban(i.user.id).then(() => {
                                client.channels.cache.get(i.channel).send(`${LANG.events.ready.theUser} \`${i.user.username}\` ${LANG.events.ready.unbanned} \`${i.inputTime}\`.`).catch(err => {});
                            }).catch(err => {});

                        }else if(i.action == 'UNMUTE') {
                            client.guilds.cache.get(x).members.cache.get(i.user.id).roles.remove(_guild.moderation.dataModeration.muterole).then(() => {
                                i.user.roles.forEach(n => {
                                    client.guilds.cache.get(x).members.cache.get(i.user.id).roles.add(n).catch(err => {});
                                });
                                client.channels.cache.get(i.channel).send(`${LANG.events.ready.theUser} \`${i.user.username}\` ${LANG.events.ready.unmuted} \`${i.inputTime}\`.`).catch(err => {});
                            }).catch(err => {
                                client.channels.cache.get(i.channel).send(`${LANG.events.ready.theUser} \`${i.user.username}\` ${LANG.events.ready.unmuted} \`${i.inputTime}\`.`).catch(err => {});                                
                            });
                        }

                        // Pulk database:
                        if(_guild.moderation.dataModeration.timers.length > 1) {
                            _guild.moderation.dataModeration.timers = await pulk(_guild.moderation.dataModeration.timers, i);
                            _guild.save();
                        }else{
                            _guild.moderation.dataModeration.timers = await pulk(_guild.moderation.dataModeration.timers, i);
                            _guild.save();
                            _timers.servers = await pulk(_timers.servers, _guild.id);
                            _timers.save();
                        }

                    }catch(err) {
                        if(_guild.moderation.dataModeration.timers.length > 1) {
                            _guild.moderation.dataModeration.timers = await pulk(_guild.moderation.dataModeration.timers, i);
                            setTimeout(() => {
                                _guild.save();
                            }, 1000 * count++);
                        }else{
                            _guild.moderation.dataModeration.timers = await pulk(_guild.moderation.dataModeration.timers, i);
                            _timers.servers = await pulk(_timers.servers, _guild.id);
                            setTimeout(() => {
                                _guild.save();
                                _timers.save();
                            }, 1000 * count++);
                        }
                    }
                }
            });
        }

    }, 120000);

};