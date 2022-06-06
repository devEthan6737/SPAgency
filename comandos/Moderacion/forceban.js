const Discord = require('discord.js-light');
const Malicious = require('../../schemas/maliciousSchema');
const db = require('megadb');
const dataRow = new db.crearDB('dataRows', 'data_bot');

module.exports = {
	nombre: 'forceban',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Banea los usuarios maliciosos de la lista negra.',
	usage: ['<prefix>forceban'],
	run: async (client, message, args, database, user) => {
        
		if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send('Necesito permiso de __Banear Miembros__.');
		if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');
		message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription('<a:sp_loading:805810562349006918> | `Generando row...`') ] }).then(async y => {
            let razones = ['Raider', 'Miembro de una squad', 'Dox', 'Bot raider', 'Spam al md', 'Flood', 'Suplantar identidad', 'Nsfw', 'Toxicidad', 'Amenaza', 'Estafa', 'Infectar usuarios', 'Multicuenta maliciosa', 'Infiltración', 'Plagio', 'Generadores uncheked', 'Uso de tools', 'Incitación a lo repulsivo', 'Violación del Tos', 'Selfbot', 'Abuso de SP Agency', 'DDos'];
            let raiders = []; let hackers = []; let estafadores = []; let botsRaiders = []; let antiToS = []; let  otros = [];
            let ids = await Malicious.find({ });
			await ids.forEach(async x => {
				let a = x.reason;

				if(a == razones[0]) {
					raiders.push(x);
				}
				else if(a == razones[1]) {
					raiders.push(x);
				}
				else if(a == razones[2]) {
					hackers.push(x);
				}
				else if(a == razones[3]) {
					botsRaiders.push(x);
				}
				else if(a == razones[4]) {
					antiToS.push(x);
				}
				else if(a == razones[5]) {
					antiToS.push(x);
				}
				else if(a == razones[6]) {
					estafadores.push(x);
				}
				else if(a == razones[7]) {
					antiToS.push(x);
				}
				else if(a == razones[8]) {
					antiToS.push(x);
				}
				else if(a == razones[9]) {
					antiToS.push(x);
				}
				else if(a == razones[10]) {
					estafadores.push(x);
				}
				else if(a == razones[11]) {
					hackers.push(x);
				}
				else if(a == razones[12]) {
					estafadores.push(x);
				}
				else if(a == razones[13]) {
					otros.push(x);
				}
				else if(a == razones[14]) {
					estafadores.push(x);
				}
				else if(a == razones[15]) {
					hackers.push(x);
				}
				else if(a == razones[16]) {
					hackers.push(x);
				}
				else if(a == razones[17]) {
					antiToS.push(x);
				}
				else if(a == razones[18]) {
					antiToS.push(x);
				}
				else if(a == razones[19]) {
					hackers.push(x);
				}
				else if(a == razones[20]) {
					otros.push(x);
				}
				else if(a == razones[21]) {
					hackers.push(x);
				}
				else{
					otros.push(x);
				}
			});
            let MaliciousRow = new Discord.MessageActionRow().addComponents(new Discord.MessageSelectMenu().setCustomId('MaliciousRow').setPlaceholder('Seleccionar tipo de forceban.').addOptions([
                {
                    label: `Raiders (${raiders.length}).`,
                    description: 'Banear a los raiders de la blacklist.',
                    value: `raiders-${message.guild.id}`,
                },
                {
                    label: `Hackers (${hackers.length}).`,
                    description: 'Banear a los hackers de la blacklist.',
                    value: `hackers-${message.guild.id}`,
                },
                {
                    label: `Estafadores (${estafadores.length}).`,
                    description: 'Banear a los estafadores de la blacklist.',
                    value: `estafadores-${message.guild.id}`,
                },
                {
                    label: `Bots raiders (${botsRaiders.length}).`,
                    description: 'Banear a los bots raiders de la blacklist.',
                    value: `bots-${message.guild.id}`,
                },
                {
                    label: `Abusos del ToS (${antiToS.length}).`,
                    description: 'Banear a los usuarios que abusan del ToS.',
                    value: `tos-${message.guild.id}`,
                },
                {
                    label: `Otros (${otros.length}).`,
                    description: 'Banear a otros usuarios de la blacklist.',
                    value: `otros-${message.guild.id}`,
                },
                {
                    label: `Todos (${ids.length})`,
                    description: 'Banear a todos los maliciosos a la vez (Premium).',
                    value: `todos-${message.guild.id}`,
                }
            ]));
            setTimeout(() => {
                y.edit({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription('Elige la opción que desea para banear usuarios maliciosos de tu servidor, sin necesidad de que sean miembros de este (`' + ids.length + ' usuarios maliciosos`).') ], components: [ MaliciousRow ] });
                dataRow.set(message.author.id, 'not-external');
                
                client.on('interactionCreate', interaction => {
                    if(interaction.isSelectMenu()) {
                        if(!interaction.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: 'Necesitas permiso de __Administrador__.', ephemeral: true });
                        
                        if(!dataRow.has(message.author.id))return;
                        dataRow.delete(message.author.id);
                        let count = 1;
                        if(interaction.values[0] == `raiders-${message.guild.id}`) {
                            raiders.forEach(async i => {
                                let r = i.reason;
                                i = i.userId;
                                setTimeout(() => {
                                    message.guild.members.ban(i.toString(), { reason: r });
                                }, count++ * 1500);
                            });
                            interaction.reply({ content: 'Baneando raiders...' });
                        }else if(interaction.values[0] == `hackers-${message.guild.id}`) {
                            hackers.forEach(async i => {
                                let r = i.reason;
                                i = i.userId;
                                setTimeout(() => {
                                    message.guild.members.ban(i.toString(), { reason: r });
                                }, count++ * 1500);
                            });
                            interaction.reply({ content: 'Baneando hackers...' });
                        }else if(interaction.values[0] == `estafadores-${message.guild.id}`) {
                            estafadores.forEach(async i => {
                                let r = i.reason;
                                i = i.userId;
                                setTimeout(() => {
                                    message.guild.members.ban(i.toString(), { reason: r });
                                }, count++ * 1500);
                            });
                            interaction.reply({ content: 'Baneando estafadores...' });
                        }else if(interaction.values[0] == `bots-${message.guild.id}`) {
                            botsRaiders.forEach(async i => {
                                let r = i.reason;
                                i = i.userId;
                                setTimeout(() => {
                                    message.guild.members.ban(i.toString(), { reason: r });
                                }, count++ * 1500);
                            });
                            interaction.reply({ content: 'Baneando bots raiders...' });
                        }else if(interaction.values[0] == `tos-${message.guild.id}`) {
                            antiToS.forEach(async i => {
                                let r = i.reason;
                                i = i.userId;
                                setTimeout(() => {
                                    message.guild.members.ban(i.toString(), { reason: r });
                                }, count++ * 1500);
                            });
                            interaction.reply({ content: 'Baneando usuarios que abusan del ToS...' });
                        }else if(interaction.values[0] == `otros-${message.guild.id}`) {
                            otros.forEach(async i => {
                                let r = i.reason;
                                i = i.userId;
                                setTimeout(() => {
                                    message.guild.members.ban(i.toString(), { reason: r });
                                }, count++ * 1500);
                            });
                            interaction.reply({ content: 'Baneando otros usuarios maliciosos...' });
                        }else if(interaction.values[0] == `todos-${message.guild.id}`) {
                            if(!user.premium.isActive)return interaction.reply({ content: '¡Debes obtener premium para banear todos los usuarios de un click!' });
                            ids.forEach(async i => {
                                let r = i.reason;
                                i = i.userId;
                                setTimeout(() => {
                                    message.guild.members.ban(i.toString(), { reason: r });
                                }, count++ * 1500);
                            });
                            interaction.reply({ content: 'Baneando todos los usuarios maliciosos de la lista negra...' });
                        }
                    }
                });
            }, 4000);
        });
	},
};