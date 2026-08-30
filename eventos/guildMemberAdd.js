const Guild = require('../schemas/guildsSchema');
const Timers = require('../schemas/timersSchema');
const Discord = require('discord.js-light');
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

        updateDataBase(client, member.guild, _guild, true);

    }catch(err) {
        console.log(err);
    }
}
