// No es recomendable tocar algo de aquí si no sabes lo que haces.

const Discord = require('discord.js-light');
const package = require('./package.json');
const os = require('os');
const process = require('process');
const cpuStat = require('cpu-stat');
const antiRF = require('./schemas/antiRF_Schema');
const Guild = require('./schemas/guildsSchema');
const Timers = require('./schemas/timersSchema');
const Warns = require('./schemas/warnsSchema');
const db = require('megadb');
const install_commands = require('./install');
const dataRow = new db.crearDB('dataRows', 'data_bot');
const usersWithCooldown = new Map();
const cooldown = new Map();
const responses = new Map();

function deleteDB() {
    // Obsoleto
}

function pulk(array, object) { // Sustituye <var>.splice();
    let newArray = [];
    for(x of array) {
        if(x != object) {
            newArray.push(x);
        }
    }
    return newArray;
}

const dataRequiredEmbed = new Discord.MessageEmbed().setColor('RED');
function dataRequired(message) {
    dataRequiredEmbed.setDescription('`' + message + '`').setFooter({ text: 'Source Code by TIB.' }); // - No cambiar.
    return { content: '`[]` = Opcional.\n`<>` = Requerido.\n`{}` = Función.', embeds: [ dataRequiredEmbed ] };
}

async function selectMenu(interaction, value, client) {
    let _guild = await Guild.findOne({ id: interaction.guild.id }); // <- The object of the server's database.

    // Help command:
    if(value === 'ho_qespa') {
        interaction.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription('La información ha sido transladada a la página web oficial:\n\nEl dominio es privado pero como eres especial para nosotros te otorgaré acceso, [click aquí.](https://youtu.be/dQw4w9WgXcQ)') ], ephemeral: true });
    }else if(value === 'ho_spaeubba') {
        interaction.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription('A nosotros, el personal del bot, nos encanta poner a prueba a SP Agency para ver su capacidad, puedes visitar nuestro canal de youtube [haciendo click aquí.](https://www.youtube.com/channel/UChSb1NskNXQ0nKG4kbNCRaQ)') ], ephemeral: true });
    }else if(value === 'ho_ddb') {
        cpuStat.usagePercent(function (error, percent) {
            if(error)return;
            let cpuDataArray = os.cpus();
            let usage = formatBytes(process.memoryUsage().heapUsed);
            let totalSeconds = (client.uptime / 1000);
            let days = Math.floor(totalSeconds / 86400);
            totalSeconds %= 86400;
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = Math.floor(totalSeconds % 60);

            interaction.reply({ embeds: [ new Discord.MessageEmbed().setTitle(client.user.username + ' - Host Debug:').addField('Bot Data:', `**Nombre del Bot**: \`${client.user.tag}\`\n**ID**: \`${client.user.id}\`\n**Versión**: \`${package.version}\`\n**Dependencias**: \`['discord.js-light', 'fs', 'mongoose', 'zlib-sync', 'bufferutil', 'utf-8-validate', 'eslint', 'manage-maliciousdb', 'discordjs/builders', 'discordjs/rest', 'byte-size', 'cpu-stat', 'discord-api-types', 'erlpack', 'ms', 'os', 'process', 'topgg-autoposter', '@top-gg/sdk', 'danbot-hosting', '@tensorflow/tfjs-node', 'request', 'axios', ]\`\n**CopyRight**: \`CC BY-NC-SA\`\n**Confianza**: \`Verificado por Discord\`\n**Servidores actuales**: \`${client.guilds.cache.size}\`\n**Usuarios en el caché**: \`${client.users.cache.size}\``).addField('Host Data:', `**Nombre de la CPU**: \`${cpuDataArray[0].model} - ${cpuDataArray.length} Cores.\`\n**Uso de memoria**: \`${usage}\`\n\n**Tiempo encendido**: \`${days}d, ${hours}h, ${minutes}m, ${seconds}s.\``).setColor(0x5c4fff) ], ephemeral: true });
            
            function formatBytes(a, b) {
                let c = 1024;
                let d = b || 2;
                let e = ['B', 'KB', 'MB', 'GB', 'TB'];
                let f = Math.floor(Math.log(a) / Math.log(c));
                return parseFloat((a / Math.pow(c, f)).toFixed(d)) + "" + e[f];
            }
        });

    // Command of commands:
    }else if(value === 'moreDetails') {
        if(interaction.user.id == interaction.guild.ownerId) {
            _guild.configuration.subData.showDetailsInCmdsCommand = 'moreDetails';
            updateDataBase(client, interaction.guild, _guild);
            interaction.reply({ content: '¡Ahora mostraré más detalles de comandos!', ephemeral: true });
        }else{
            interaction.reply({ content: 'Necesitas ser __El propietario De Este Servidor__.', ephemeral: true });
        }
    }else if(value === 'lessDetails') {
        if(interaction.user.id == interaction.guild.ownerId) {
            _guild.configuration.subData.showDetailsInCmdsCommand = 'lessDetails';
            updateDataBase(client, interaction.guild, _guild);
            interaction.reply({ content: '¡Ahora mostraré menos detalles de comandos!', ephemeral: true });
        }else{
            interaction.reply({ content: 'Necesitas ser __El propietario De Este Servidor__.', ephemeral: true });
        }
    }else if(value === 'twoOptions') {
        if(interaction.user.id == interaction.guild.ownerId) {
            _guild.configuration.subData.showDetailsInCmdsCommand = 'twoOptions';
            updateDataBase(client, interaction.guild, _guild);
            interaction.reply({ content: '¡Ahora daré a elegir al usuario el tipo de detalles que quiere ver en los comandos!', ephemeral: true });
        }else{
            interaction.reply({ content: 'Necesitas ser __El propietario De Este Servidor__.', ephemeral: true });
        }

    // Command of editPingReply
    }else if(value === 'allDetails') {
        if(!interaction.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
        _guild.configuration.subData.pingMessage = 'allDetails';
        updateDataBase(client, interaction.guild, _guild);
        interaction.reply({ content: '¡Ahora mostraré la mayor información posible cuando alguien me mencione!', ephemeral: true });
    }else if(value === 'pingLessDetails') {
        if(!interaction.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
        _guild.configuration.subData.pingMessage = 'pingLessDetails';
        updateDataBase(client, interaction.guild, _guild);
        interaction.reply({ content: '¡Ahora mostraré la menor información posible cuando alguien me mencione!', ephemeral: true });
    }else if(value === 'onlySupportServer') {
        if(!interaction.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
        _guild.configuration.subData.pingMessage = 'onlySupportServer';
        updateDataBase(client, interaction.guild, _guild);
        interaction.reply({ content: '¡Ahora solo mostraré el servidor de soporte de mi personal cuando alguien me mencione!', ephemeral: true });
    }else if(value === 'ignore') {
        if(!interaction.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
        let user = await antiRF.findOne({ user: interaction.user.id });
        if(!user.premium.isActive)return interaction.reply({ content: '`Esa opción es para usuarios premium.`', ephemeral: true });
        _guild.configuration.subData.pingMessage = 'ignore';
        updateDataBase(client, interaction.guild, _guild);
        interaction.reply({ content: '¡Ahora ignoraré cuando alguien me mencione!', ephemeral: true });
    
    // Others:
    }else{
        let arr = await dataRow.get(interaction.user.id);
        if(!arr)return interaction.reply({ content: 'Necesitas volver a activar el comando.', ephemeral: true });
        if(arr != 'not-external') {
            let _split = `${interaction.values[0]}`.split('_');
            arr.forEach(async x => {
                if(x.value == `whitelist_${_split[1]}`) {
                    dataRow.delete(interaction.user.id);
                    _guild.configuration.whitelist = await pulk(_guild.configuration.whitelist, _split[1]);
                    updateDataBase(client, interaction.guild, _guild);
                    interaction.reply({ content: 'Bot eliminado de la whitelist.', ephemeral: true });
                }
            });
        }
    }
}

async function automoderator(client, mongoose, message, sanctionReason) {
    let userWarns = await Warns.findOne({ guildId: message.guild.id, userId: message.author.id });
    if(!userWarns) {
        let newUser = new Warns({
            guildId: message.guild.id,
            userId: message.author.id,
            warns: [],
            subCount: 1
        });
        userWarns = newUser;
        newUser.save();
        return;
    }

    if(userWarns.subCount >= 2) {
        userWarns.subCount = 0;

        userWarns.warns.push({
            reason: sanctionReason,
            moderator: `${client.user.id}`
        });
        userWarns.save();

        message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`<@${message.author.id}>, has sido advertido.\n\nRazón: \`${sanctionReason}\`\nModerador: \`${client.user.tag}\``) ] });

        if(userWarns.warns.length == mongoose.moderation.automoderator.actions.warns[0]) {
            if(message.member.roles.cache.has(mongoose.moderation.dataModeration.muterole))return;
            if(!message.guild.me.permissions.has('MANAGE_ROLES')) {
                client.users.cache.get(message.guild.ownerId).send('No tengo permisos para mutear a un usuario, he desactivado el automoderador.').catch(err => {
                    message.channel.send('<@' + message.guild.ownerId + '>, no tengo permisos para mutear al usuario, he desactivado el automoderador.');
                });
                mongoose.moderation.automoderator.enable = false;
                mongoose.save();
                return;
            }
            let remember = [];

            try{
                message.member.roles.cache.forEach(x => {
                    remember.push(x.id);
                    message.member.roles.remove(x.id).catch(err => {});
                });
            
                message.member.roles.add(mongoose.moderation.dataModeration.muterole).catch(err => {
                    message.channel.send(err);
                });
            }catch(err) {
                message.channel.send(err);
            }
            mongoose.moderation.dataModeration.timers.push({
                user: {
                    id: message.author.id,
                    username: message.author.username,
                    roles: remember
                },
                endAt: Date.now() + mongoose.moderation.automoderator.actions.muteTime[0],
                action: 'UNMUTE',
                channel: message.channel.id,
                inputTime: mongoose.moderation.automoderator.actions.muteTime[1]
            });
            mongoose.save();
            let _timers = await Timers.findOne({ });
            if(!_timers.servers.includes(message.guild.id)) {
                _timers.servers.push(message.guild.id);
                _timers.save();
            }
            message.reply({ content: `He muteado a \`${message.author.username}\` durante \`${mongoose.moderation.automoderator.actions.muteTime[1]}\` por tener demasiadas infracciónes.` });
        }else if(userWarns.warns.length > mongoose.moderation.automoderator.actions.warns[1]) {
            if(mongoose.moderation.automoderator.actions.action == 'BAN') {
                if(!message.guild.me.permissions.has('BAN_MEMBERS')) {
                    client.users.cache.get(message.guild.ownerId).send('No tengo permisos para banear a un usuario, he desactivado el automoderador.').catch(err => {
                        message.channel.send('<@' + message.guild.ownerId + '>, no tengo permisos para banear al usuario, he desactivado el automoderador.');
                    });
                    mongoose.moderation.automoderator.enable = false;
                    mongoose.save();
                    return;
                }
                message.guild.members.ban(message.author.id).then(() => {
                    message.channel.send('He baneado al usuario.');
                }).catch(err => {});
                return;
            }else{
                if(!message.guild.me.permissions.has('KICK_MEMBERS')) {
                    client.users.cache.get(message.guild.ownerId).send('No tengo permisos para expulsar a un usuario, he desactivado el automoderador.').catch(err => {
                        message.channel.send('<@' + message.guild.ownerId + '>, no tengo permisos para expulsar al usuario, he desactivado el automoderador.');
                    });
                    mongoose.moderation.automoderator.enable = false;
                    mongoose.save();
                    return;
                }
                message.guild.members.kick(message.author.id).then(() => {
                    message.channel.send('He expulsado al usuario.');
                }).catch(err => {});
                return;
            }
        }
        return;
    }else{
        userWarns.subCount = userWarns.subCount + 1;
        userWarns.save();
    }
}

async function intelligentSOS(_guild, client, eventType) {
    if(_guild.protection.intelligentSOS.cooldown == false) {
        let guild = await client.guilds.cache.get(_guild.id) || await client.guilds.fetch(_guild.id);
        let invite = await guild.channels.cache.filter(m => m.type == 'GUILD_TEXT').random().createInvite();
        if(invite != undefined) {
            client.channels.cache.get('0').send('@everyone SOS de `' + eventType + '`:\nhttps://discord.gg/' + invite);
            client.channels.cache.get('0').send('@everyone SOS de `' + eventType + '`:\nhttps://discord.gg/' + invite);
        }

        _guild.protection.intelligentSOS.cooldown = true;
        updateDataBase(client, guild, _guild, true);

        setTimeout(() => {
            _guild.protection.intelligentSOS.cooldown = false;
            updateDataBase(client, guild, _guild, true);
        }, 120000);
    }
}

async function ratelimitFilter(message) {
    if(usersWithCooldown.has(message.author.id)) {
		let seeCooldown = await usersWithCooldown.get(message.author.id);
		if(seeCooldown != new Date().getHours()) {
			usersWithCooldown.delete(message.author.id);
		}else return false;
	}

	if(!cooldown.has(message.author.id)) {
		cooldown.set(message.author.id, 1);
	}

	let stop = await cooldown.get(message.author.id);

	if(stop >= 3) {
		message.channel.send(`Debido a la inundación de comandos, has sido limitado (Es decir, no podrás usar comandos) durante ${60 - new Date().getMinutes()} minutos.`);
		usersWithCooldown.set(message.author.id, parseInt(new Date().getHours()));
        return false;
	}else{
		
		if(stop == 2) message.channel.send('Escribe los comandos de forma más lenta o serás limitado.').then(x => {
			setTimeout(() => {
				x.delete();
			}, 1500);
		});

		cooldown.set(message.author.id, await cooldown.get(message.author.id) +1);

		setTimeout(async () => {
            cooldown.set(message.author.id, await cooldown.get(message.author.id) -1);
		}, 1000);

        return true;
	}
}

async function fecthDataBase(client, guild, save = true) {
    let database = await client.database.guilds.get(guild.id, true) || await Guild.findOne({ id: guild.id });
    if(!database)return install_commands(client, guild);
    if(save) updateDataBase(client, guild, database);
    return database;
}

let used = false;
async function updateDataBase(client, guild, database, important = false) {
    if(!database) {
        database = await install_commands(client, guild);
    }else{
        if(used == false || important == true) {
            used = true;
            let db = await Guild.findOne({ id: guild.id });
            db = database;
            if(db) {
                await Guild.findOneAndUpdate({ id: guild.id }, database);
            }
            if(guild && guild.id) client.database.guilds.post(guild.id, db);

            used = false;
        }
    }
}

async function fecthUsersDataBase(client, user, save = true) {
    let database = await client.database.users.get(user.id, true) || await antiRF.findOne({ user: user.id });
    if(save) updateUsersDataBase(client, user, database);
    return database;
}

let used2 = false;
async function updateUsersDataBase(client, user, database, important = false) {
    if(database) {
        if(used2 == false || important == true) {
            used2 = true;
            let db = await antiRF.findOne({ user: user.id });
            db = database;
            if(db) {
                await Guild.findOneAndUpdate({ id: user.id }, database);
            }
            if(user && user.id) client.database.users.post(user.id, db);

            used2 = false;
        }
    }
}

function newResponse(response) {
    responses.set(response.authorId, response);
}

async function getResponseAndDelete(userId) {
    if(responses.has(userId)) {
        let res = await responses.get(userId);
        responses.delete(userId);
        return res;
    }
}

module.exports = {
    deleteDB, selectMenu, pulk, dataRequired, automoderator, intelligentSOS, ratelimitFilter,
    fecthDataBase, updateDataBase, fecthUsersDataBase, updateUsersDataBase, newResponse,
    getResponseAndDelete
}