const Guild = require('../schemas/guildsSchema');
const Timers = require('../schemas/timersSchema');
const Discord = require('discord.js-light');
const ms = require('ms');
const { pulk, fecthDataBase, updateDataBase } = require('../functions');
const characters = 'qwertyuiopasdfghjklñzxcvbnmQWERTYUIOPASDFGHJKLÑZXCVBNM1234567890';

module.exports = async (client, member) => {
    client.users.fetch(member.guild.ownerId);

    let _guild = await fecthDataBase(client, member.guild, false);
    if(!_guild)return;
    let malicious = await client.ubfb.getUser(member.user.id);
    let LANG = require(`../LANG/${_guild.configuration.language}.json`);
    
    
    try{
        let cache = await client.super.cache.get(member.guild.id, true);
            
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


        updateDataBase(client, member.guild, _guild, true);

    }catch(err) {
        console.log(err);
    }
}
