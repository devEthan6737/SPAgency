const Guild = require('../schemas/guildsSchema');
const Timers = require('../schemas/timersSchema');
const antiRF = require('../schemas/antiRF_Schema');
const Malicious = require('../schemas/maliciousSchema');
const Discord = require('discord.js-light');
const ms = require('ms');
const { pulk, fecthDataBase, updateDataBase, fecthUsersDataBase } = require('../functions');
const characters = 'qwertyuiopasdfghjklñzxcvbnmQWERTYUIOPASDFGHJKLÑZXCVBNM1234567890';

module.exports = async (client, member) => {
    client.users.fetch(member.guild.ownerId);

    let _guild = await fecthDataBase(client, member.guild, false);
    if(!_guild)return;
    let malicious = await Malicious.findOne({ userId: member.user.id });
    let LANG = require(`../LANG/${_guild.configuration.language}.json`);
    let user = await fecthUsersDataBase(client, member.user);
    if(!user) {
        let newUser = new antiRF({
            user: member.user.id,
            isBloqued: false,
            isToken: false,
            achievements: {
                array: [ 'Humano.' ],
                data: {
                    bugs: 0,
                    serversCreatedTotally: 0,
                    serversPartner: [],
                    reports: 0,
                    totalVotes: 0,
                    initialMember: 0
                }
            },
            serversCreated: {
                servers: 0,
                date: 'hello?',
            },
            premium: {
                isActive: false,
                endAt: 0
            },
            servers: []
        });
        newUser.save();
        user = await antiRF.findOne({ user: member.user.id });
    }
    
    // Logs:
    try{
        if(_guild.configuration.logs[0]) {
            client.channels.cache.get(_guild.configuration.logs[0]).send({ content: '`LOG:` ' + LANG.events.guildMemberAdd.log_memberAdd + '.', embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(member.guild.name, member.guild.iconURL()).addField(`${LANG.events.guildMemberAdd.log_person}:`, `\`${member.user.username} (${member.user.id})\``, true) ] }).catch(err => {});
        }
    }catch(err) {
        client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (guildMemberAdd): \`${err}\`` }).catch(() => {});
        _guild.configuration.logs = [];
    }

    // User is bloqued:
    if(user && user.isBloqued) {
        if(member.guild.me.permissions.has('BAN_MEMBERS')) {
            member.send({ embeds: [ new Discord.MessageEmbed().setDescription(`<:sp_flecha:875788005766492181> \`${member.user.tag}\`, ${`${LANG.events.guildMemberAdd.kickBloqUser}`.replace('<var1>', member.guild.name)}.`).setFooter(member.guild.name, member.guild.iconURL).setColor(0x5c4fff) ] }).then(() => {
                member.guild.members.ban(member, { reason: `${LANG.events.guildMemberAdd.kickBloqUserReason}.` }).catch(err => {});
            }).catch(() => {
                member.guild.members.ban(member, { reason: `${LANG.events.guildMemberAdd.kickBloqUserReason}.` }).catch(err => {});
            });
        }
    }
    
    try{
        let cache = await client.super.cache.get(member.guild.id);

        // Antijoins:
        if(_guild.protection.antijoins.enable == true) {

            if(cache.remember.length > 0 && cache.remember.includes(member.user.id)) {
                if(member.guild.me.permissions.has('BAN_MEMBERS')) {
                    member.send({ embeds: [ new Discord.MessageEmbed().setDescription(`<:sp_flecha:875788005766492181> <@${member.user.id}> ${`${LANG.events.guildMemberAdd.antijoinsMessage}`.replace('<var1>', member.guild.name)}.`).setFooter(member.guild.name, member.guild.iconURL).setColor(0x5c4fff) ] }).then(() => {
                        member.guild.members.ban(member, { reason: `${LANG.events.guildMemberAdd.antijoinsReason}.` }).catch(err => {});
                    }).catch(() => {
                        member.guild.members.ban(member, { reason: `${LANG.events.guildMemberAdd.antijoinsReason}.` }).catch(err => {});
                    });
                    return;
                }
            }else{
                if(member.guild.me.permissions.has('KICK_MEMBERS')) {
                    member.send({ embeds: [ new Discord.MessageEmbed().setDescription(`<:sp_flecha:875788005766492181> <@${member.user.id}> ${LANG.events.guildMemberAdd.antijoinsMessage1}.`.replace('<var1>', member.guild.name)).setFooter(member.guild.name, member.guild.iconURL).setColor(0x5c4fff) ] }).then(() => {
                        member.guild.members.kick(member, `${LANG.events.guildMemberAdd.antijoinsReason1}.`).catch(err => {});
                    }).catch(() => {
                        member.guild.members.kick(member, `${LANG.events.guildMemberAdd.antijoinsReason}.`).catch(err => {});
                    });
                    client.super.cache.push({ id: member.guild.id }, member.user.id);
                    
                    setTimeout(async () => {
                        client.super.cache.extract({ id: member.guild.id }, member.user.id);
                    }, 60000);
                    return;
                }
            }
        }

        // warnEntry:
        if(_guild.protection.warnEntry == true) {
            if(malicious && malicious.isMalicious) {
                client.users.cache.get(member.guild.ownerId).send({ embeds: [new Discord.MessageEmbed().setDescription(`${LANG.events.guildMemberAdd.warnEntry_MessagePart1} \`${member.guild.name}\`.\n\n${LANG.events.guildMemberAdd.warnEntry_MessagePart2} <@${member.user.id}> (${member.user.id}) ${LANG.events.guildMemberAdd.warnEntry_MessagePart3} \`${member.guild.name} (${member.guild.id})\`.`).addField(`${LANG.events.guildMemberAdd.warnEntry_MessagePart4}:`, `Tag: **${member.user.tag}**\nID: **${member.user.id}**\n${LANG.events.guildMemberAdd.warnEntry_MessagePart5}: **${malicious.reason}**`).setColor(0x0056ff) ] }).catch(err => {});
                client.channels.cache.get('822649641715630151').send({ embeds: [ new Discord.MessageEmbed().setDescription(`Usuario Malicioso Detectado En \`${member.guild.name} (${member.guild.id})\``).addField('Usuario:', `<@${member.user.id}> (${member.user.id})`, true).setTimestamp().setColor(0x0056ff) ] }).catch(err => {});
            }
        }

        // kickMalicious:
        if(_guild.protection.kickMalicious.enable == true && malicious && malicious.isMalicious) {
            if(cache.remember.length > 0 && cache.remember.includes(member.user.id)) {
                if(member.guild.me.permissions.has('BAN_MEMBERS')) {
                    member.send({ embeds: [ new Discord.MessageEmbed().setDescription(`<:sp_flecha:875788005766492181> <@${member.user.id}> ${LANG.events.guildMemberAdd.kickMaliciousBanMessage1} \`${member.guild.name}\`.\n\`${LANG.events.guildMemberAdd.kickMaliciousBanMessage2}(https://discord.gg/RuBvM5r9eM)**.`).setFooter(member.guild.name, member.guild.iconURL).setColor(0x5c4fff) ] }).then(() => {
                        member.guild.members.ban(member, { reason: `${LANG.events.guildMemberAdd.kickMaliciousBanReason}.` }).catch(err => {});
                    }).catch(() => {
                        member.guild.members.ban(member, { reason: `${LANG.events.guildMemberAdd.kickMaliciousBanReason}.` }).catch(err => {});
                    });
                }
            }else{
                if(member.guild.me.permissions.has('KICK_MEMBERS')) {
                    member.send({ embeds: [ new Discord.MessageEmbed().setDescription(`<:sp_flecha:875788005766492181> <@${member.user.id}> ${LANG.events.guildMemberAdd.kickMaliciousKickMessage1} \`${member.guild.name}\`.\n\`${LANG.events.guildMemberAdd.kickMaliciousKickMessage1}(https://discord.gg/RuBvM5r9eM)**.`).setFooter(member.guild.name, member.guild.iconURL).setColor(0x5c4fff) ] }).then(() => {
                        member.guild.members.kick(member, `${LANG.events.guildMemberAdd.kickMaliciousKickReason}.`).catch(err => {});
                    }).catch(() => {
                        member.guild.members.kick(member, `${LANG.events.guildMemberAdd.kickMaliciousKickReason}.`).catch(err => {});
                    });
                    client.super.cache.push({ id: member.guild.id }, member.user.id);
                    
                    setTimeout(async () => {
                        client.super.cache.extract({ id: member.guild.id }, member.user.id);
                    }, 60000);
                    return;
                }
            }
        }

        if(member.user.bot) {
            
            // Antibots
            if(_guild.protection.antibots.enable == true) {
                if(_guild.protection.antibots._type == 'all') {
                    if(member.guild.me.permissions.has('KICK_MEMBERS')) {
                        await member.guild.members.kick(member.user.id, `${LANG.events.guildMemberAdd.antibotsKickReason}.`).catch(err => {});
                        let embed = new Discord.MessageEmbed()
                        .setDescription(`${LANG.events.guildMemberAdd.antibotsMessage1} \`${member.user.tag}\` ${LANG.events.guildMemberAdd.antibotsMessage2}.`)
                        .setColor(0x5c4fff);
                        client.users.cache.get(member.guild.ownerId).send({ embeds: [ embed ] }).catch(err => {});
                    }
                }else if(_guild.protection.antibots._type == 'only_nv' && !member.user.flags.has(65536)) {
                    if(member.guild.me.permissions.has('KICK_MEMBERS')) {
                        await member.guild.members.kick(member.user.id, `${LANG.events.guildMemberAdd.antibotsKickReason}.`).catch(err => {});
                        let embed = new Discord.MessageEmbed()
                        .setDescription(`${LANG.events.guildMemberAdd.antibotsMessage1} \`${member.user.tag}\` ${LANG.events.guildMemberAdd.antibotsMessage3}.`)
                        .setColor(0x5c4fff);
                        client.users.cache.get(member.guild.ownerId).send({ embeds: [ embed ] }).catch(err => {});
                    }
                }else if(_guild.protection.antibots._type == 'only_v' && member.user.flags.has(65536)) {
                    if(member.guild.me.permissions.has('KICK_MEMBERS')) {
                        await member.guild.members.kick(member.user.id, `${LANG.events.guildMemberAdd.antibotsKickReason}.`).catch(err => {});
                        let embed = new Discord.MessageEmbed()
                        .setDescription(`${LANG.events.guildMemberAdd.antibotsMessage1} \`${member.user.tag}\` ${LANG.events.guildMemberAdd.antibotsMessage4}.`)
                        .setColor(0x5c4fff);
                        client.users.cache.get(member.guild.ownerId).send({ embeds: [ embed ] }).catch(err => {});
                    }
                }
            }
            
            // Save bots entrities:
            member.guild.fetchAuditLogs({ type: 'ADD_BOT' }).then(async logs => {
                let persona = logs.entries.first().executor;
                
                if(malicious && malicious.isMalicious == member.user.id) {

                    if(member.guild.me.permissions.has('BAN_MEMBERS')) {
                        await member.guild.members.ban(persona, { reason: `${LANG.events.guildMemberAdd.saveBotsEntrities}.` }).catch(err => {});
                    }
                    
                }else{
                    
                    if(!member.user.flags.has(65536)) {                        
                        _guild.protection.antiraid.saveBotsEntrities.authorOfEntry = persona.id;
                        _guild.protection.antiraid.saveBotsEntrities._bot = member.user.id;
                    }
                    
                }
            });

        }else{
            
            // Antitokens:
            if(_guild.protection.antitokens.enable == true) {

                if(cache.amount > 3) {
                    if(member.guild.me.permissions.has('KICK_MEMBERS') && user.isToken == false) {
                        member.guild.members.kick(member, `${LANG.events.guildMemberAdd.antitokensKickReason}.`).catch(err => {});
                    }
                }
                for(x of `${member.user.username}`.split(' ')) {
                    if(cache.remember.length > 0 && cache.remember.includes(x) && x != '') {
                        if(member.guild.me.permissions.has('BAN_MEMBERS') && user.isToken == false) {
                            client.users.cache.get(member.user.id).send(`${LANG.events.guildMemberAdd.antitokensMessage}.\``).then(() => {
                                member.guild.members.ban(member, { reason: `${LANG.events.guildMemberAdd.antitokensKickReason}.` }).catch(err => {});
                            }).catch(err => {});
                        }
                    }else{
                        client.super.cache.push({ id: member.guild.id }, x);
                    }
                }

                if(_guild.protection.verification.enable == true && _guild.protection.verification._type == '--v4') {
                    member.roles.add(_guild.protection.verification.role).catch(err => {});
                }
            }

            // markMalicious:
            if(_guild.protection.markMalicious.enable == true) {
                if(malicious && malicious.isMalicious) {
                    if(_guild.protection.markMalicious._type == 'changeNickname') {
                        if(member.guild.me.permissions.has('MANAGE_NICKNAMES')) {
                            member.setNickname(`${malicious.reason}`).catch(err => {});
                        }
                    }else if(_guild.protection.markMalicious._type == 'sendLog') {
                        if(_guild.configuration.logs[0]) {
                            client.channels.cache.get(_guild.configuration.logs[0]).send({ content: '`LOG:` Detectada entrada de usuario __malicioso__.', embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(member.guild.name, member.guild.iconURL()).addField('Persona:', `\`${member.user.username} (${member.user.id})\``, true) ] }).catch(err => {});
                        }
                    }else if(_guild.protection.markMalicious._type == 'sendLogToOwner') {
                        client.channels.cache.get(member.guild.ownerId).send({ content: '`LOG:` Detectada entrada de usuario __malicioso__.', embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(member.guild.name, member.guild.iconURL()).addField('Persona:', `\`${member.user.username} (${member.user.id})\``, true) ] }).catch(err => {});
                    }else{
                        member.roles.add(_guild.protection.markMalicious._type.split(':')[1]).catch(err => {});
                    }
                }
            }

            // Verification:
            if(_guild.protection.verification.enable == true) {
                if(_guild.protection.verification._type == '--v1') {
                    client.channels.cache.get(_guild.protection.verification.channel).send({ content: `¡Bienvenido <@${member.user.id}>! Debes esperar pacientemente hasta que el personal del servidor te verifique.` }).catch(err => {});
                }else if(_guild.protection.verification._type == '--v2') {
                    let intentos = 3;
                    let code = `verify ${characters[Math.floor(Math.random() * characters.length)]}${characters[Math.floor(Math.random() * characters.length)]}.${characters[Math.floor(Math.random() * characters.length)]}${characters[Math.floor(Math.random() * characters.length)]}.${characters[Math.floor(Math.random() * characters.length)]}${characters[Math.floor(Math.random() * characters.length)]}`;
                    let guildChannel = client.channels.cache.get(_guild.protection.verification.channel);
                    guildChannel.send({ content: `¡Bienvenido <@${member.user.id}>! Para ver los demás canales debes escribir el código adjunto a este mensaje.\n\nTienes: **${intentos}** intentos y **160** segundos.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`\`${code}\``) ] }).then(x => {
                        let collector = guildChannel.createMessageCollector({ time: 160000 });
                        collector.on('collect', async m => {
                            if(m.content == '')return;
                            if(m.author.id == member.user.id) {
                                if(m.content == code) {
                                    if(member.guild.me.permissions.has('MANAGE_ROLES')) {
                                        member.roles.add(_guild.protection.verification.role).catch(err => guildChannel.send({ content: 'Ha sucedido un error inesperado.' }));
                                        guildChannel.bulkDelete(100);
                                        collector.stop();
                                    }else{
                                        guildChannel.send({ content: 'Error, no tengo permisos para agregarte el rol.' });
                                    }
                                }else{
                                    if(intentos == 1) {
                                        if(member.guild.me.permissions.has('KICK_MEMBERS')) {
                                            member.guild.members.kick(member, 'Falló en la verificación.').catch(err => {});
                                            guildChannel.bulkDelete(100);
                                        }else{
                                            guildChannel.send({ content: 'Error al intentar expulsar al usuario, no tengo permisos.' });
                                        }
                                        collector.stop();
                                    }else{
                                        intentos--;
                                        code = `verify ${characters[Math.floor(Math.random() * characters.length)]}${characters[Math.floor(Math.random() * characters.length)]}.${characters[Math.floor(Math.random() * characters.length)]}${characters[Math.floor(Math.random() * characters.length)]}.${characters[Math.floor(Math.random() * characters.length)]}${characters[Math.floor(Math.random() * characters.length)]}`;
                                        x.edit({ content: `Error, vuelve a escribir el nuevo código adjunto. ¡Con cuidado!\n\nTienes: **${intentos}** intentos y **menos de 160 segundos**.`, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`\`${code}\``) ] })
                                    }
                                }
                            }
                        });
                        collector.on('end', () => {
                            guildChannel.bulkDelete(99);
                        });
                    }).catch(err => {});
                }
            }

            // cannotEnterTwice
            if(_guild.protection.cannotEnterTwice.enable == true) {
                if(cache.remember.includes(member.user.id)) {
                    member.guild.members.kick(member, 'Sistema cannotEnterTwice activo.');
                }else{
                    client.super.cache.push({ id: member.guild.id }, member.user.id);
                }
            }

            // bloqEntritiesByName
            if(_guild.protection.bloqEntritiesByName.names.length > 0) {
                for(let x of _guild.protection.bloqEntritiesByName.names) {
                    if(`${member.user.username}`.includes(x)) {
                        if(member.guild.me.permissions.has('KICK_MEMBERS')) {
                            client.users.cache.get(member.user.id).send({ content: 'Tu nombre incluye caracteres que fueron prohibidos en el servidor.' }).then(() => {
                                member.guild.members.kick(member, 'Nombre prohibido.').catch(err => {});
                            }).catch(() => {
                                member.guild.members.kick(member, 'Nombre prohibido.').catch(err => {});
                            });
                        }
                    }
                }
            }

            // bloqNewCreatedUsers
            if(_guild.protection.bloqNewCreatedUsers && member.user.createdTimestamp > Date.now() - ms(_guild.protection.bloqNewCreatedUsers.time)) {
                if(member.guild.me.permissions.has('KICK_MEMBERS')) {
                    client.users.cache.get(member.user.id).send({ content: `Tu cuenta debe llevar activa ${_guild.protection.bloqNewCreatedUsers.time} para entrar al servidor.` }).then(() => {
                        member.guild.members.kick(member, 'Cuenta nueva.').catch(err => {});
                    }).catch(() => {
                        member.guild.members.kick(member, 'Cuenta nueva.').catch(err => {});
                    });
                }
            }

            // Add muterole if user is muted
            let _timers = await Timers.findOne({ });
            if(_timers.servers.includes(member.guild.id)) {
                _guild.moderation.dataModeration.timers.forEach(async i => {
                    if(i.user.id == member.user.id) {
                        member.roles.add(_guild.moderation.dataModeration.muterole).catch(err => {});
                    }
                });
            }
        }

        updateDataBase(client, member.guild, _guild, true);

    }catch(err) {
        console.log(err);
    }
}