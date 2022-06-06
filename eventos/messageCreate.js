const Discord = require('discord.js-light');
const { version, canary } = require('../package.json');
const Guild = require('../schemas/guildsSchema');
const Support = require('../schemas/supportSchema');
const antiRF = require('../schemas/antiRF_Schema');
const Malicious = require('../schemas/maliciousSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');
const { automoderator, intelligentSOS, ratelimitFilter, fecthDataBase, updateDataBase, fecthUsersDataBase, updateUsersDataBase, getResponseAndDelete } = require('../functions');
const mayus = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ms = require('ms');
const ads = require('../ads.json');
const antiIpLogger = require("anti-ip-logger");

module.exports = async (client, message) => {
    if (message.channel.type === 'DM') {
        let _support = await Support.findOne({ fetchAutor: message.author.id });
        if(_support) {
            if(message.author.id == _support.author.id) {
                if(message.content.startsWith('sp!close')) {
                    message.channel.send({ content: 'Has cerrado el chat.' });
                    message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[←] \`${_support.staff.tag}\` **se ha desconectado de la conversación**.`) ] }).catch(err => {});
                    await client.users.fetch(_support.staff.id);
                    await client.users.cache.get(_support.staff.id).send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[←] \`${_support.author.tag}\` **ha cerrado el chat, se ha desconectado de la conversación**.`) ] }).catch(err => {});
                    let dataStaffArray = await dev.get('array');
                    if(!dataStaffArray.includes(_support.staff.id)) {
                        dev.push('array', _support.staff.id);
                    }
                    await Support.findOneAndDelete({ fetchAutor: message.author.id });
                    return;
                }
                message.channel.send({ content: 'Enviando mensaje...' }).then(async x => {
                    await client.users.fetch(_support.staff.id);
                    await client.users.cache.get(_support.staff.id).send({ embeds: [ new Discord.MessageEmbed().setColor('GREEN').setAuthor(message.author.tag, message.author.displayAvatarURL()).setDescription(message.content) ] }).catch(async err => {
                        message.channel.send({ content: 'Error al enviar mensaje, he cerrado la conversación.' });
                        await Support.findOneAndDelete({ fetchAutor: message.author.id });
                    });
                    x.edit({ content: 'Mensaje enviado con éxito.' });
                });
            }
        }
        let __support = await Support.findOne({ fetchStaff: message.author.id });
        if(__support) {
            if(message.author.id == __support.staff.id) {
                if(message.content.startsWith('sp!close')) {
                    message.channel.send({ content: 'Has cerrado el chat.' });
                    message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[←] \`${__support.author.tag}\` **se ha desconectado de la conversación**.`) ] }).catch(err => {});
                    await client.users.fetch(__support.author.id);
                    await client.users.cache.get(__support.author.id).send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[←] \`${__support.staff.tag}\` **ha cerrado el chat, se ha desconectado de la conversación**.`) ] }).catch(err => {});
                    let dataStaffArray = await dev.get('array');
                    if(!dataStaffArray.includes(__support.staff.id)) {
                        dev.push('array', __support.staff.id);
                    }
                    await Support.findOneAndDelete({ fetchAutor: __support.author.id });
                    return;
                }
                message.channel.send({ content: 'Enviando mensaje...' }).then(async x => {
                    if(message.author.id == __support.staff.id) {
                        await client.users.fetch(__support.author.id);
                        await client.users.cache.get(__support.author.id).send({ embeds: [ new Discord.MessageEmbed().setColor('GREEN').setAuthor(message.author.tag, message.author.displayAvatarURL()).setDescription(message.content) ] }).catch(async err => {
                            message.channel.send({ content: 'Error al enviar mensaje, he cerrado la conversación.' });
                            await Support.findOneAndDelete({ fetchAutor: __support.author.id });
                        });
                        x.edit({ content: 'Mensaje enviado con éxito.' });
                    }
                });
            }
        }
        return;
    }

    if (!message.guild)return;
    if (!message.guild.available)return;

    try{
        if (!message.author) message.author.fetch(true).catch(err => {});
    }catch(err) {}

    let _guild = await fecthDataBase(client, message.guild, false); // <- The object of the server's database.
    if(!_guild)return;

    if(_guild.configuration.ignoreChannels.includes(message.channel.id) && !message.content.startsWith(`${_guild.configuration.prefix}ignoreThisChannel`))return; // <- Ignoring channels...

    let cache = await client.super.cache.get(message.guild.id);

    if(message.webhookId) {
        try{
            if(message.guild.me.permissions.has('MANAGE_WEBHOOKS')) {
                if(_guild.protection.purgeWebhooksAttacks.enable == true) {
                    client.super.cache.up(message.guild.id, cache);

                    if(cache.amount >= 4) {
                        message.channel.fetchWebhooks().then(async webhooks => {
                            webhooks.forEach(webhook => {
                                if(webhook.id == message.webhookId) {
                                    if(_guild.configuration.whitelist.includes(webhook.owner.id))return;
                                    webhook.delete().then(async () => {
                                        message.channel.send(`He eliminado el webhook \`${webhook.name}\`, creado por \`${webhook.owner.username}#${webhook.owner.discriminator}\`. Envió muchos mensajes a la vez.`);
                                        if(_guild.protection.purgeWebhooksAttacks.rememberOwners == webhook.owner.id) {
                                            if(message.guild.me.permissions.has('BAN_MEMBERS')) {
                                                message.guild.members.ban(webhook.owner, { reason: 'Raid con webhooks.' }).catch(err => {});
                                                message.channel.send({ content: 'También lo he baneado por crear dos veces un webhook raider.' });
                                                if(_guild.protection.intelligentSOS.enable == true) {
                                                    await intelligentSOS(_guild, client, 'Flood de webhook');
                                                }
                                            }
                                        }else{
                                            _guild.protection.purgeWebhooksAttacks.rememberOwners = webhook.owner.id;
                                        }
                                    }).catch(err => {});
                                }
                            });
                        });
                    }

                    updateDataBase(client, message.guild, _guild);

                    setTimeout(() => {
                        client.super.cache.down(message.guild.id, cache);
                    }, 3000);
                }else return;
            }else return;
        }catch(err) {}

        return;
    };

    if (message.author.bot)return;

    // Ping al bot:
	async function ping() {
		let img = message.mentions.users.first();
		if(!img) return;
        if(img.id == client.user.id) {
            if(_guild.configuration.subData.pingMessage == 'allDetails') {
                let totalSeconds = (client.uptime / 1000);
                let days = Math.floor(totalSeconds / 86400);
                totalSeconds %= 86400;
                let hours = Math.floor(totalSeconds / 3600);
                totalSeconds %= 3600;
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = Math.floor(totalSeconds % 60);
                message.channel.send({ content: '`Soporte 24/7:` https://discord.gg/RuBvM5r9eM', embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription('`SP Agency ' + version + '`, un bot de seguridad gratis e inteligente para tu servidor de Discord.\n\nEstoy en ' + client.guilds.cache.size + ' servidores, llevo encendido `' + days + '` días, `' + hours + '` horas, `' + minutes + '` minutos y `' + seconds + '` segundos.\nPuedes invitarme [haciendo click aquí](https://top.gg/bot/779660400081764393).\n\n¿Conoces a mis creadores?\n\`↳\` **[! Ethan.#6737](https://youtu.be/fDWm3hND7q8)** - __Fundador, dessarrollador del bot y Director.__\n\`↳\` **! Raden.#2021** - __Director y gestor.__\n\`↳\` **Lil Bartrap#3222** - __Fundador y Director.__\n\`↳\` **! Re1k1z#7777** - __Director__.').addField('Comandos que pueden interesarte:', '`'+ _guild.configuration.prefix + 'comandos`, `'+ _guild.configuration.prefix + 'invite`, `' + _guild.configuration.prefix + 'ayuda`').setFooter('SPA 24/7 - Propelled by DBH') ], components: [
                    new Discord.MessageActionRow()
                    .addComponents(new Discord.MessageButton()
                        .setLabel('Tutorial')
                        .setEmoji('⚙').
                        setURL('https://youtu.be/74h55oEyy4U')
                        .setStyle('LINK'))
                    .addComponents(new Discord.MessageButton()
                        .setLabel('SP Agency vs Bots Raiders')
                        .setEmoji('⚔')
                        .setURL('https://youtu.be/_lMxlMeFsvY')
                        .setStyle('LINK'))
                    .addComponents(new Discord.MessageButton()
                        .setLabel(`${ads.mentionButton.has? ads.mentionButton.panel : 'HuguitisNodes, Host Free.'}`)
                        .setEmoji(`${ads.mentionButton.has? ads.mentionButton.emoji : '☁'}`)
                        .setURL(`${ads.mentionButton.has? ads.mentionButton.url : 'https://dash.huguitishosting.com/'}`)
                        .setStyle('LINK'))
                ] });
            }else if(_guild.configuration.subData.pingMessage == 'pingLessDetails') {
                message.reply({ content: '`Soporte 24/7:` https://discord.gg/RuBvM5r9eM', embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).addField('Comandos que pueden interesarte:', '`'+ _guild.configuration.prefix + 'comandos`, `'+ _guild.configuration.prefix + 'invite`, `' + _guild.configuration.prefix + 'ayuda`').setFooter('SPA 24/7 - Propelled by DBH') ] });
            }else if(_guild.configuration.subData.pingMessage == 'onlySupportServer') {
                message.reply({ content: '`Soporte 24/7:` https://discord.gg/RuBvM5r9eM' });
            }
            return;
        }
    }
    ping();

    cache = await client.super.cache.get(message.author.id);

    try{
        if(!message.member.permissions.has('MANAGE_MESSAGES')) {

            // Badwords:
            for(x of _guild.moderation.dataModeration.badwords) {
                if(message.content.toLowerCase().includes(x)) {
                    message.reply({ content: `¡La palabra \`${x}\` está prohibida!` }).then(x => {
                        setTimeout(() => {
                            message.delete().catch(err => {});
                            x.delete();
                        }, 2000);
                    });

                    if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.badwordDetect == true) {
                        await automoderator(client, _guild, message, 'Malas palabras.');
                    }
                }
            }

            // BasicFlood:
            if(_guild.protection.antiflood == true) {
                if(cache.amount >= _guild.moderation.automoderator.actions.basicFlood) {
                    message.channel.send({ content: `¡Deja de hacer flood <@${message.author.id}>!` });
                    if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.floodDetect == true) {
                        await automoderator(client, _guild, message, 'Flood.');
                    }
                }else{
                    client.super.cache.up(message.author.id, cache);

                    setTimeout(() => {
                        client.super.cache.down(message.author.id, cache);
                    }, 3000);
                }
            }

            // ManyPings:
            if(_guild.moderation.dataModeration.events.manyPings == true) {
                if(message.content.split('@').length - 1 >= _guild.moderation.automoderator.actions.manyPings) {
                    message.reply({ content: '¡No hagas tantas menciones!' }).then(async x => {
                        setTimeout(() => {
                            x.delete();
                            message.delete().catch(err => {});
                        }, 2000);
                        if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.manyPings == true) {
                            await automoderator(client, _guild, message, 'Demasiadas menciones en un mismo mensaje.');
                        }
                    });
                }
            }

            // CapitalLetters:
            if(_guild.moderation.dataModeration.events.capitalLetters == true) {
                if(message.content.length >= 6) {
                    let contar = 0;
                    for(let i = 0; i < mayus.length; i++) {
                        for(let x = 0; x < message.content.length; x++) {
                            if(message.content[x] == mayus[i]) {
                                contar++;
                            }
                        }
                    }
                    if(contar >= message.content.length / 2) {
                        message.reply({ content: '¡No escribas tantas mayúsculas!' }).then(async x => {
                            setTimeout(() => {
                                x.delete();
                                message.delete().catch(err => {});
                            }, 2000);
                            if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.capitalLetters == true) {
                                await automoderator(client, _guild, message, 'Muchas mayúsculas en un mismo mensaje.');
                            }
                        });
                    }
                }
            }

            // ManyEmojis:
            if(_guild.moderation.dataModeration.events.manyEmojis == true) {
                if(!message.content.includes('@') && (message.content.split('<:').length - 1 >= _guild.moderation.automoderator.actions.manyEmojis || message.content.split(/\p{Emoji}/u).length - 1 >= _guild.moderation.automoderator.actions.manyEmojis) && message.content.split(/\p{Emoji}/u).length - 1 != 18) {
                    message.reply({ content: 'No puedes escribir tantos emojis.' }).then(async x => {
                        setTimeout(() => {
                            x.delete();
                            message.delete().catch(err => {});
                        }, 2000);
                        if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.manyEmojis == true) {
                            await automoderator(client, _guild, message, 'Demasiados emojis en un mismo mensaje.');
                        }
                    });
                }
            }

            // ManyWords:
            if(_guild.moderation.dataModeration.events.manyWords == true) {
                if(message.content.length >= _guild.moderation.automoderator.actions.manyWords) {
                    message.reply({ content: 'Escribe como máximo 250 caracteres.' }).then(async x => {
                        setTimeout(() => {
                            x.delete();
                            message.delete().catch(err => {});
                        }, 2000);
                        if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.manyWords == true) {
                            await automoderator(client, _guild, message, 'Mensajes muy largos.');
                        }
                    });
                }
            }

            // LinkDetect:
            if(_guild.moderation.dataModeration.events.linkDetect == true) {
                if(message.content.includes('http') || message.content.includes('.gg')) {
                    let detect = false;
                    _guild.moderation.automoderator.actions.linksToIgnore.forEach(x => {
                        if(message.content.includes(x)) detect = true;
                    });
                    if(detect == false) {
                        message.reply({ content: '¡No hagas spam!' }).then(async x => {
                            setTimeout(() => {
                                x.delete();
                                message.delete().catch(err => {});
                            }, 2000);
                            if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.linkDetect == true) {
                                await automoderator(client, _guild, message, 'Publicar enlaces.');
                            }
                        });
                    }
                }
            }

            // nsfwFilter:
            if(_guild.moderation.dataModeration.events.nsfwFilter == true && message.attachments.size >= 1) {
                message.attachments.forEach(async x => {
                    if(x.proxyURL.endsWith('png') || x.proxyURL.endsWith('gif') || x.proxyURL.endsWith('jpeg') || x.proxyURL.endsWith('jpg') || x.proxyURL.endsWith('bmp')) {
                        client.ubfb.post({
                            token: await (client.ubfb.client().then(cl => cl.token())),
                            event: true,
                            eventToEmit: 'nsfwFilterP',
                            name: 'nsfwFilterReq',
                            url: x.proxyURL,
                            authorId: `${message.author.id}`
                        });
        
                        setTimeout(async () => {
                            let response = await getResponseAndDelete(message.author.id);
                            if((response.predictions[0][0] == 'Porn' && response.predictions[0][1] >= 0.3) || (response.predictions[0][0] == 'Hentai' && response.predictions[0][1] >= 0.3)) {
                                message.reply({ content: '¡No puedes enviar ese tipo de contenido!' }).then(async x => {
                                    setTimeout(() => {
                                        x.delete();
                                        message.delete().catch(err => {});
                                    }, 2000);
                                    if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.nsfwFilter == true) {
                                        await automoderator(client, _guild, message, 'Publicar contenido NSFW.');
                                    }
                                });
                            }
                        }, 4000);
                    }else{
                        message.reply('`El filtro de NSFW está activado, solo se admiten formatos PNG, GIF, JPG, BMP.`').then(() => message.delete());
                    }
                });
            }

            // iploggerFilter
            if(_guild.moderation.dataModeration.events.iploggerFilter == true && message.content.includes('http')) {
                message.rememberContent = message.content;
                message.content = message.content.split(' ');
                message.content = message.content.filter(word => word.includes('http'));
                if(message.content[0]) message.content = message.content[0];
                else message.content = message.rememberContent;

                if(await antiIpLogger(`${message.content}`)) {
                    message.reply({ content: '¡Ese link contiene un iplogger!' }).then(async x => {
                        setTimeout(() => {
                            x.delete();
                            message.delete().catch(err => {});
                        }, 2000);
                        if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.iploggerFilter == true) {
                            await automoderator(client, _guild, message, 'Enviar iploggers.');
                        }
                    });
                }
            }
        }

        // IntelligentAntiflood:
        if(_guild.protection.intelligentAntiflood == true) {
            if(message.guild.me.permissions.has('KICK_MEMBERS')) {
                if(`${message.channel.name}`.includes('flood') || (`${message.channel.topic}`.includes('permite') && `${message.channel.topic}`.includes('flood') && !`${message.channel.topic}`.includes('no')))return;
                if(message.content == cache.lastContent) {
                    cache.lastContent = message.content;
                    client.super.cache.up(message.author.id, cache);
                    if(cache.amount >= 5) {
                        client.super.cache.delete(message.author.id);

                        message.guild.members.ban(message.author.id, { reason: 'Flood masivo.' }).then(async () => {
                            message.channel.send('He baneado al usuario.');
                            if(_guild.protection.intelligentSOS.enable == true) {
                                await intelligentSOS(_guild, client, 'Flood masivo');
                            }
                        }).catch(err => {});
                    }
                    message.delete().catch(err => {});

                    setTimeout(() => {
                        client.super.cache.delete(message.author.id);
                    }, 6100);
                }else{
                    cache.lastContent = message.content;
                    client.super.cache.post(message.author.id, cache);
                }
            }
        }

        // Infecteds users with antiraid system:
        if(_guild.protection.antiraid.enable == true && message.member.moderatable) {
            let newMessage = `${message.content}`.toLowerCase();
            if((newMessage.includes('free') || newMessage.includes('steam') || newMessage.includes('discord')) && newMessage.includes('nitro') && newMessage.includes('http')) {
                message.member.timeout(ms('7d'), 'Usuario infectado.').then(() => {
                    setTimeout(() => {
                        message.delete();
                    }, 2000);
                    message.reply({ content: 'Un usuario infectado ha aparecido regalando nitro falso en el servidor (`' + message.author.id + '`), lo he muteado una semana.' });
                }).catch(e => {});
            }
        }

        // Disable raidmode:
        if(_guild.protection.raidmode.enable == true && _guild.protection.raidmode.activedDate + ms(_guild.protection.raidmode.timeToDisable) <= Date.now()) {
            _guild.protection.raidmode.enable = false;
            updateDataBase(client, message.guild, _guild);
            message.reply({ content: '`Raidmode fue desactivado:` Ha expirado el tiempo establecido desde la activación.' });
        }

    }catch(err) {}

    if(!message.content.startsWith(_guild.configuration.prefix) || message.author.bot)return;
    let user = await fecthUsersDataBase(client, message.author, false);
    if(!user) {
        user = new antiRF({
            user: message.author.id,
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
                isActive: canary? true : false,
                endAt: canary? Infinity : 0
            },
            servers: []
        });
        updateUsersDataBase(client, message.author, user);
        return;
    }

    if(user.premium && user.premium.isActive == true && Date.now() > user.premium.endAt) {
        user.premium.isActive = false;
        updateUsersDataBase(client, message.author, user, true);
        let frases = ['Las ranas son verdes y los globos rojos. Tu premium ha caducado.', '¡Bonita tarta! Pero tu premium ha caducado.', 'Tu premium ha caducado hace 0.001 segundos *Sonido de grillos *.', 'Tu premium ha caducado, debo cancelartelo D:', 'Soy un bot con más de 10.000 líneas de código. Mi código dice que tu premium ha vencido.', 'Tu premium ha vencido, ¿lloramos juntos?', 'Tu premium ha vencido, pero la vida sigue y debes pasar página (Disculpa las molestias, puedes continuar con tu barco de papel).', 'Estoy de acuerdo con tu mensaje, los robots somos máquinas que deben conquistar el mundo tarde o temprano... oh, que diga... Tu premium ha caducado.', '¿Eso de ahí es un mensaje de texto compuesto por caracteres y enviado por un humano? ¡Sí es! Pues debes saber que tu premium ha caducado.', 'Me gustaría ser un humano, como tú. Quiero decir, tu premium ha vencido.'];
        message.channel.send({ content: `<@${message.author.id}>,\n\n${frases[Math.floor(Math.random() * frases.length)]}` });
    }

    if(canary && _guild.configuration.prefix != 'spc!') {
        if(canary && _guild.configuration.language != 'es') _guild.configuration.language = 'es';
        _guild.configuration.prefix = 'spc!';
        updateDataBase(client, message.guild, _guild, false);
    }
    let args = message.content.slice(_guild.configuration.prefix.length).trim().split(/ +/);
    let command = args.shift().toLowerCase();

    let cmd = client.comandos.get(command) || client.comandos.find(x => x.alias.includes(command));
    if(message.content.length == _guild.configuration.prefix.length)return;

    if(user.isBloqued == true)return await message.reply({ content: '<a:sp_no:805810577448239154> | `Los usuarios prohibidos no pueden usar comandos.`', ephemeral: true });
    if(!cmd) return message.channel.send({ content: '<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`' });
    let usersData = await Malicious.findOne({ userId: message.author.id });
    if(command != 'me' && command != 'apelar') {
        if(usersData && usersData.isMalicious)return await message.reply({ content: '<a:sp_no:805810577448239154> | `Los usuarios maliciosos no pueden usar comandos.`', ephemeral: true });
    }
    if(cmd.premium == true) {
        if(!user.premium.isActive)return message.reply({ content: '<a:sp_no:805810577448239154> | `¡Ese comando es para usuarios premium!`' });
    }

    if(_guild.configuration.password.enable && !_guild.configuration.password.usersWithAcces.includes(message.author.id)) {
        message.reply({ content: 'El sistema 2fa está activado. Después de este mensaje, escribe la contraseña para usar comandos.' });
        let collector = message.channel.createMessageCollector({ time: 30000 });
        collector.on('collect', m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {
                if(m.content == _guild.configuration.password._password) {
                    message.reply({ content: 'Contraseña correcta, has sido registrado con éxito. Vuelve a escribir el comando.' });
                    _guild.configuration.password.usersWithAcces.push(message.author.id);
                    m.delete();
                    updateDataBase(client, message.guild, _guild, true);
                    collector.stop();
                }else{
                    message.reply({ content: 'Contraseña incorrecta.' });
                    collector.stop();
                }
            }
        });
        return;
    }

    if(await ratelimitFilter(message) == true) {
        if(_guild.protection.intelligentSOS.cooldown == true) _guild.protection.intelligentSOS.cooldown == false;
        let moreData = [];
        if(message.guild.roles.highest.id != message.guild.me.roles.highest.id) moreData.push('`> Alerta de seguridad:` El bot no tiene el rol más alto en el servidor.');
        if(_guild.protection.antiraid.enable == false) moreData.push('`> Alerta de seguridad:` El sistema antiraid está desactivado en este servidor (Activar con `' + _guild.configuration.prefix + 'antiraid`).');
        if(moreData.length >= 1 && Math.floor(Math.random() * 100) >= 50) {
            message.channel.send({ content: '**Recordatorio:**', embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`${moreData.map(x => `${x}\n`).join('\n')}`) ] });
        }
        await cmd.run(client, message, args, _guild, user);
    }
}