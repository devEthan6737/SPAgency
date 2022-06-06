const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'autoconfig',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Una configuración automática basada en tus gustos.',
	usage: ['<prefix>autoconfig'],
    run: async (client, message, args, _guild) => {
        return message.reply(':flag_es: El comando ha sido descontinuado por fallas. De igual forma vamos a intentar volver habilitarlo para la próxima versión.');
    
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(message.author.id != message.guild.ownerId)return message.reply({ content: 'Necesitas ser __El propietario De Este Servidor__.' });
        if(!_guild.moderation.dataModeration.muterole)return message.channel.send(`Se debe especificar el rol de muteo con \`${_guild.configuration.prefix}setmuterole <roleMention>\``)

        message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription('¿Tienes prisa? Vamos a configurarme rápido, ¿vale?\n\nPara comenzar dime lo que buscas:\n__Una buena moderación:__ Escribe `m`\n__Más seguridad que el banco nacional de España:__ Escribe `s`\n__Simplemente, haz algo:__ Escribe `no sé`') ] });
        let collector = message.channel.createMessageCollector({ time: 30000 });
        collector.on('collect', m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {

                if(m.content.toLowerCase() == 'm') {
                    collector.stop();
                    message.channel.send({ content: 'Está bien, moderación. ¿Deseas algo simple o que ni un gatito adorable con orejitas suaves pueda comportarse mal?\n\n__Una moderación simple:__ Escribe `m`\n__Te gustan los gatos pero también una moderación excelente:__ `g`' });
                    collector = message.channel.createMessageCollector({ time: 30000 });
                    collector.on('collect', _m => {
                        if(_m.content == '')return;
                        if(_m.author.id == message.author.id) {
            
                            if(_m.content.toLowerCase() == 'm') {
                                collector.stop();
                                message.channel.send({ content: '¿A ti también te va lo simple? ¡Dusfruta tu nueva configuración!' });
                                _guild.moderation.dataModeration.badwords.push('cp', 'dox', 'matate', 'suicidate', 'suicidio', 'child porn', 'raid', 'squad', 'matar');
                                _guild.moderation = {
                                    dataModeration: {
                                        events: {
                                            manyPings: true,
                                            capitalLetters: false,
                                            manyEmojis: true,
                                            manyWords: true,
                                            linkDetect: true
                                        },
                                        snipes: {
                                            editeds: [],
                                            deleteds: []
                                        }
                                    },
                                    automoderator: {
                                        enable: true,
                                        actions: {
                                            warns: [3, 5],
                                            muteTime: [3600000, '10h'],
                                            action: 'BAN',
                                            linksToIgnore: ['.gif', '.png', '.jpg', '.txt', '.mp3'],
                                            floodDetect: 5,
                                            manyEmojis: 4,
                                            manyPings: 4,
                                            manyWords: 300,
                                        },
                                        events: {
                                            badwordDetect: true,
                                            floodDetect: true,
                                            manyPings: true,
                                            capitalLetters: false,
                                            manyEmojis: true,
                                            manyWords: true,
                                            linkDetect: true
                                        }
                                    }
                                }

                            }else if(_m.content.toLowerCase() == 'g') {
                                collector.stop();
                                message.channel.send({ content: 'Definitivamente, los gatos no te gustan o no te importan tanto como intentas aparentar. De igual forma, opino igual que tú. La moderación avanzada es mejor.' });
                                _guild.moderation.dataModeration.badwords.push('cp', 'dox', 'matate', 'suicidate', 'suicidio', 'child porn', 'raid', 'squad', 'matar');
                                _guild.moderation = {
                                    dataModeration: {
                                        events: {
                                            manyPings: true,
                                            capitalLetters: true,
                                            manyEmojis: true,
                                            manyWords: true,
                                            linkDetect: true
                                        }
                                    },
                                    automoderator: {
                                        enable: true,
                                        actions: {
                                            warns: [3, 5],
                                            muteTime: [3600000, '10h'],
                                            action: 'BAN',
                                            linksToIgnore: ['.gif', '.png', '.jpg', '.txt', '.mp3'],
                                            floodDetect: 5,
                                            manyEmojis: 4,
                                            manyPings: 4,
                                            manyWords: 300,
                                        },
                                        events: {
                                            badwordDetect: true,
                                            floodDetect: true,
                                            manyPings: true,
                                            capitalLetters: true,
                                            manyEmojis: true,
                                            manyWords: true,
                                            linkDetect: true
                                        }
                                    }
                                }

                            }else{
                                message.reply({ content: 'No te he entendido, he desactivado el comando.' });
                                collector.stop();
                            }
                        }
                    });
                    collector.on('end', () => {
                    });
                }else if(m.content.toLowerCase() == 's') {
                    collector.stop();
                    message.channel.send({ content: 'Seguridad, bien. ¿Deseas algo simple o que ni un perrito adorable con orejitas suaves, con camiseta de cuero y con ojitos hermosos pueda comportarse mal?\n\n__Una seguridad básica:__ Escribe `b`\n__Te gustan los perros pero también una seguridad excelente:__ `p`' });
                    collector = message.channel.createMessageCollector({ time: 30000 });
                    collector.on('collect', _m => {
                        if(_m.content == '')return;
                        if(_m.author.id == message.author.id) {
            
                            if(_m.content.toLowerCase() == 'b') {
                                collector.stop();
                                message.channel.send({ content: '¿A ti también te va lo simple? ¡Disfruta tu nueva configuración!' });
                                _guild.protection = {
                                    antiraid: {
                                        enable: true,
                                        amount: 0,
                                        saveBotsEntrities: {
                                            authorOfEntry: '',
                                            _bot: ''
                                        }
                                    },
                                    antibots: {
                                        enable: true,
                                        _type: 'all'
                                    },
                                    antitokens: {
                                        enable: false,
                                        usersEntrities: [],
                                        entritiesCount: 0
                                    },
                                    antijoins: {
                                        enable: false,
                                        rememberEntrities: []
                                    },
                                    markMalicious: {
                                        enable: true,
                                        _type: 'changeNickname'
                                    },
                                    warnEntry: true,
                                    kickMalicious: {
                                        enable: false,
                                        rememberEntrities: []
                                    },
                                    verification: {
                                        enable: false,
                                        _type: 'v1',
                                        channel: '',
                                        role: ''
                                    },
                                    cannotEnterTwice: {
                                        enable: false,
                                        users: []
                                    },
                                    purgeWebhooksAttacks: {
                                        enable: true,
                                        amount: 0,
                                        rememberOwners: ''
                                    },
                                    intelligentSOS: {
                                        enable: false,
                                        cooldown: false
                                    },
                                    intelligentAntiflood: false,
                                    antiflood: true,
                                }

                            }else if(_m.content.toLowerCase() == 'p') {
                                collector.stop();
                                message.channel.send({ content: 'Definitivamente, los perros con nariz no están tan mal con lo cual la seguridad avanzada es mejor.' });
                                _guild.protection = {
                                    antiraid: {
                                        enable: true,
                                        amount: 0,
                                        saveBotsEntrities: {
                                            authorOfEntry: '',
                                            _bot: ''
                                        }
                                    },
                                    antibots: {
                                        enable: true,
                                        _type: 'all'
                                    },
                                    antitokens: {
                                        enable: true,
                                        usersEntrities: [],
                                        entritiesCount: 0
                                    },
                                    antijoins: {
                                        enable: false,
                                        rememberEntrities: []
                                    },
                                    markMalicious: {
                                        enable: true,
                                        _type: 'changeNickname'
                                    },
                                    warnEntry: true,
                                    kickMalicious: {
                                        enable: false,
                                        rememberEntrities: []
                                    },
                                    verification: {
                                        enable: false,
                                        _type: 'v1',
                                        channel: '',
                                        role: ''
                                    },
                                    cannotEnterTwice: {
                                        enable: false,
                                        users: []
                                    },
                                    purgeWebhooksAttacks: {
                                        enable: true,
                                        amount: 0,
                                        rememberOwners: ''
                                    },
                                    intelligentSOS: {
                                        enable: true,
                                        cooldown: false
                                    },
                                    intelligentAntiflood: true,
                                    antiflood: true,
                                }

                            }else{
                                message.reply({ content: 'No te he entendido, he desactivado el comando.' });
                                collector.stop();
                            }
                        }
                    });
                    collector.on('end', () => {
                    });
                }else if(m.content.toLowerCase() == 'no sé') {
                    message.channel.send({ content: 'A veces dos opciones son muchas, ¿verdad? No pasa nada, tengo la solución: Moderación y seguridad por igual. ¡Disfruta tu nueva configuración!' });
                    _guild.protection = {
                        antiraid: {
                            enable: true,
                            amount: 0
                        },
                        antibots: {
                            enable: false,
                            _type: 'all'
                        },
                        antitokens: {
                            enable: false,
                            usersEntrities: [],
                            entritiesCount: 0
                        },
                        antijoins: {
                            enable: false,
                            rememberEntrities: []
                        },
                        markMalicious: {
                            enable: true,
                            _type: 'changeNickname',
                            rememberEntrities: []
                        },
                        warnEntry: true,
                        kickMalicious: {
                            enable: false,
                            rememberEntrities: []
                        },
                        ownSystem: {
                            enable: false
                        },
                        verification: {
                            enable: false,
                        },
                        cannotEnterTwice: {
                            enable: false,
                            users: []
                        },
                        purgeWebhooksAttacks: {
                            enable: true,
                            amount: 0
                        },
                        intelligentSOS: {
                            enable: false,
                            cooldown: false
                        },
                        intelligentAntiflood: false,
                        antiflood: true,
                    }
                    _guild.moderation = {
                        dataModeration: {
                            events: {
                                manyPings: true,
                                capitalLetters: false,
                                manyEmojis: false,
                                manyWords: false,
                                linkDetect: false
                            },
                            snipes: {
                                editeds: [],
                                deleteds: []
                            }
                        },
                        automoderator: { // Default moderation on the server.
                            enable: false,
                            actions: {
                                warns: [ 3, 5 ],
                                muteTime: [ 3600000, '10h' ],
                                action: 'BAN',
                                linksToIgnore: [ '.gif', '.png', '.jpg', '.txt', '.mp3' ],
                                floodDetect: 5,
                                manyEmojis: 4,
                                manyPings: 4,
                                manyWords: 250,
                            },
                            events: {
                                badwordDetect: true,
                                floodDetect: true,
                                manyPings: true,
                                capitalLetters: false,
                                manyEmojis: false,
                                manyWords: false,
                                linkDetect: true
                            },
                        },
                    }

                }else{
                    message.reply({ content: 'No te he entendido, he desactivado el comando.' });
                    collector.stop();
                }
            }
        });
        collector.on('end', () => {
        });
    },
}