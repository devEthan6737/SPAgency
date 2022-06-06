const Discord = require('discord.js-light');
const Backup = require('../../schemas/backupsSchema');
const byteSize = require('byte-size');
const { dataRequired } = require('../../functions');

// Hemos cambiado la estructura de nuestro sistema de backups a uno mejor. Puedes usar este, mejorarlo o instalar un npm.

module.exports = {
	nombre: 'backup',
	category: 'Moderación',
    premium: true,
	alias: [],
	description: 'Realiza una copia de seguridad de tu servidor .',
	usage: ['<prefix>backup {create, delete, update, load, info} <password>'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(message.author.id != message.guild.ownerId)return message.reply({ content: 'Necesitas ser __El propietario De Este Servidor__.' });

        let _backup = await Backup.findOne({ guildId: message.guild.id });
        if(!_backup) {
            _backup = new Backup({
                guildId: message.guild.id,
                enable: false,
                password: 0,
                channels: {
                    category: [],
                    text: [],
                    noCategory: []
                },
                roles: [],
                bans: []
            });
            _backup.save();
            return message.reply({ content: 'Había datos importantes no recolectados antes de usar este comando, los he recolectado ahora. Vuelve a escribir el comando.' });
        }

        if(args[0] == 'create' || args[0] == 'update') {
            if(_backup.enable == true && args[0] == 'create')return message.reply({ content: 'Ya hay un backup creado, si deseas actualizar el backup debes usar la función `update` de este comando.' });
            message.guild.members.fetch();
            message.guild.channels.fetch();
            message.guild.bans.fetch();
            message.guild.roles.fetch();
            message.guild.emojis.fetch();
            message.guild.stickers.fetch();
        
            message.channel.send({ content: 'Creando backup... '}).then(async wait => {

                let newBackup = {
                    name: message.guild.name,
                    icon: message.guild.iconURL(),
                    channels: {
                        category: [],
                        text: [],
                        noCategory: []
                    },
                    roles: [],
                    bans: [],
                };

                message.guild.channels.cache.forEach(x => {
                    if(x.type === 'GUILD_PUBLIC_THREAD')return;
                    let permissions;
                    if(typeof x.permissionOverwrites == 'object') {
                        permissions = [];
                    }else{
                        permissions = x.permissionOverwrites;
                    }

                    if(x.type === 'GUILD_CATEGORY') {
                        newBackup.channels.category.push({
                            name: x.name,
                            type: x.type,
                            rawPosition: x.rawPosition,
                            permissionOverwrites: permissions,
                        });
                    }else if((x.type === 'GUILD_TEXT' || x.type === 'GUILD_VOICE' || x.type === 'GUILD_NEWS') && x.parentId != null) {
                        newBackup.channels.text.push({
                            name: x.name,
                            topic: x.topic,
                            type: x.type,
                            nsfw: x.nsfw,
                            parent: client.channels.cache.get(x.parentId).name,
                            rawPosition: x.rawPosition,
                            permissionOverwrites: permissions,
                        });
                    }else{
                        newBackup.channels.noCategory.push({
                            name: x.name,
                            topic: x.topic,
                            type: x.type,
                            nsfw: x.nsfw,
                            rawPosition: x.rawPosition,
                            permissionOverwrites: permissions,
                        });
                    }
                });
                
                message.guild.roles.cache.forEach(x => {
                    if(x.name === '@everyone' || (x.tags && x.tags.botId))return;
                    newBackup.roles.push({
                        name: x.name,
                        color: x.color,
                        hoist: x.hoist,
                        permissions: JSON.stringify(x.permissions),
                        rawPosition: x.rawPosition,
                        mentionable: x.mentionable,
                    });
                });

                let bans = await message.guild.bans.fetch();
                bans.forEach(x => {
                    newBackup.bans.push({
                        id: x.user.id,
                        reason: x.reason
                    });
                });
                
                //Saving backup...
                _backup.guildId = message.guild.id;
                _backup.password = Math.floor(Math.random() * 9999999999);
                _backup.enable = true;
                _backup.name = newBackup.name;
                _backup.icon = newBackup.icon,
                _backup.channels.category = newBackup.channels.category;
                _backup.channels.text = newBackup.channels.text;
                _backup.channels.noCategory = newBackup.channels.noCategory;
                _backup.roles = newBackup.roles;
                _backup.bans = newBackup.bans;
                _backup.save();

                // Sending message...
                let memory = JSON.stringify(newBackup);
                memory = encodeURI(memory).split(/%..|./).length - 1;
                memory = byteSize(memory);

                let cORu;
                if(args[0] == 'update') cORu = 'actualizado'; else cORu = 'creado';
                wait.edit({ content: `Backup ${cORu} con éxito:`, embeds: [
                    new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`\`\`\`${newBackup.channels.text.length + newBackup.channels.noCategory.length} canales guardados.\n${newBackup.channels.category.length} categorías guardadas.\n${newBackup.roles.length} roles guardados.\n${bans.size} usuarios baneados han sido guardados.\nPeso del backup: ${memory.value}${memory.unit} (${memory.long})\`\`\``)
                ] });
            });
        }else if(args[0] == 'load') {
            if(!args[1])return message.channel.send(await dataRequired('Debes indicar la contraseña antes de cargar el backup (es cambiante, para obtener pídela en el servidor de soporte oficial).\n\n' + _guild.configuration.prefix + 'backup load <password>'));
            if(_backup.password != args[1])return message.channel.send(await dataRequired('Esa contraseña es incorrecta (es cambiante, para obtener pídela en el servidor de soporte oficial).\n\n' + _guild.configuration.prefix + 'backup load <password>'));
            message.guild.channels.fetch();
            message.guild.bans.fetch();
            message.guild.roles.fetch();
            message.guild.emojis.fetch();
            message.guild.stickers.fetch();

            try{
                message.guild.setName('Cargando backup...');
                
                let count = 0;
                
                message.guild.channels.cache.forEach(x => {
                    count++;
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 500 * count);
                });
                
                message.guild.roles.cache.forEach(x => {
                    count++;
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 500 * count);
                });
                
                // Loading backup...
                setTimeout(async() => {
                    count = 0;
                    
                    _backup.channels.category.forEach(x => {
                        count++;
                        setTimeout(() => {
                            message.guild.channels.create(x.name,
                                {
                                    type: x.type,
                                    rawPosition: x.rawPosition,
                                    permissionOverwrites: x.permissionOverwrites,
                                },
                            ).then(parent => {
                                _backup.channels.text.forEach(x => {
                                    if(x.parent && x.parent == parent.name) {
                                        message.guild.channels.create(x.name,
                                            {
                                                topic: x.topic,
                                                type: x.type,
                                                nsfw: x.nsfw,
                                                parent: parent.id,
                                                rawPosition: x.rawPosition,
                                                permissionOverwrites: x.permissionOverwrites,
                                            },
                                        ).catch(err => {});
                                    }
                                });
                            }).catch(err => {});
                        }, 500 * count);
                    });
                            
                    _backup.channels.noCategory.forEach(x => {
                        count++;
                        setTimeout(() => {
                            message.guild.channels.create(x.name,
                                {
                                    topic: x.topic,
                                    type: x.type,
                                    nsfw: x.nsfw,
                                    rawPosition: x.rawPosition,
                                    permissionOverwrites: x.permissionOverwrites,
                                },
                            ).catch(err => {});
                        }, 500 * count);
                    });
                    
                    _backup.roles.forEach(x => {
                        count++;
                        setTimeout(() => {
                            message.guild.roles.create({
                                name: x.name,
                                color: x.color,
                                hoist: x.hoist,
                                permissions: JSON.parse(x.permissions),
                                position: x.rawPosition,
                                mentionable: x.mentionable,
                                icon: x.icon,
                                unicodeEmoji: x.unicodeEmoji,
                            }).catch(err => {});
                        }, 500 * count);
                    });

                    _backup.bans.forEach(x => {
                        count++;
                        setTimeout(() => {
                            if(x.reason === null) x.reason = 'Sin especificar.';
                            message.guild.members.ban(x.id, { reason: x.reason });
                        }, 500 * count);
                    });
                                
                    message.guild.setName(_backup.name).catch(err => {});
                    message.guild.setIcon(_backup.icon).catch(err => {});
                }, 500 * count);
                            
            }catch(err) {}
        }else if(args[0] == 'info') {
            let orderChannels = {
                array: [],
                noCategory: []
            };
            _backup.channels.category.forEach(x => {
                orderChannels.array.push(x.name);
                orderChannels[x.name] = [];
                _backup.channels.text.forEach(i => {
                    if(x.name == i.parent) {
                        orderChannels[x.name].push(i.name);
                    }
                });
            });
            _backup.channels.noCategory.forEach(x => {
                orderChannels.noCategory.push(x.name);
            });

            if(_backup.roles.length == 0) _backup.roles = ['Sin roles guardados.'];

            let memory = JSON.stringify(_backup);
            memory = encodeURI(memory).split(/%..|./).length - 1;
            memory = byteSize(memory);

            message.reply({ content: 'Información de backup:', embeds: [
                new Discord.MessageEmbed().setColor(0x0056ff).setFooter(_backup.name, _backup.icon).setAuthor('Canales:').setDescription(`\`\`\`${orderChannels.noCategory.map(x => `  [-] ${x}`).join('\n')}\n\n${ orderChannels.array.map(x => `[+] ${x}\n${ orderChannels[x].map(i => `  [-] ${i}`).join('\n') }`).join('\n\n') }\`\`\``),
                new Discord.MessageEmbed().setColor(0x0056ff).setFooter(_backup.name, _backup.icon).setAuthor('Roles:').setDescription(`\`\`\`${_backup.roles.map(x => `[+] ${x.name}`).join('\n')}\`\`\``),
                new Discord.MessageEmbed().setColor(0x0056ff).setFooter(_backup.name, _backup.icon).setAuthor('Otros datos:').setDescription(`\`\`\`${_backup.bans.length} usuarios baneados han sido guardados.\nPeso del backup: ${memory.value}${memory.unit} (${memory.long})\`\`\``)
            ] });
        }else{
            message.reply(await dataRequired('Debes indicar la función del comando.\n\n' + _guild.configuration.prefix + 'backups {create, delete, update, load, info}'));
        }
    },
}