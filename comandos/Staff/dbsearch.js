// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');
const Model1 = require('../../schemas/antiRF_Schema');
const Model2 = require('../../schemas/guildsSchema');
const Model3 = require('../../schemas/maliciousSchema');
const Model4 = require('../../schemas/backupsSchema');
const Model5 = require('../../schemas/warnsSchema');

module.exports = {
	nombre: 'dbseatch',
	category: 'Staff',
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        let roles = await dev.get(`${message.author.id}.roles`);
		if(roles.includes('835570094221426750')) {
            try{
                if(!args[0])return message.channel.send({ content: 'Uso: `dbsearch <[user, guild, malicious, backup, warnByGuild, warnByUser]> <id> [json]`' });
                if(!args[1])return message.channel.send({ content: 'No escribiste la id.' });
                if(args[2] && args[2] != 'json')return message.channel.send({ content: 'No.' });

                let model;
                if(args[0] == 'user') {
                    model = await Model1.find({ user: args[1] });
                    if(args[2])return message.channel.send({ content: '```json\n' + model + '\n```' });
                    else message.channel.send({ content: `USER: <Model [${model.length}]>` });
                }else if(args[0] == 'guild') {
                    model = await Model2.find({ id: args[1] });
                    if(args[2])return message.channel.send({ content: '```json\n{"Respuesta denegada": "Modelo con demasiada longitud"}\n```' });
                    else message.channel.send({ content: `GUILD: <Model [${model.length}]>` });
                }else if(args[0] == 'malicious') {
                    model = await Model3.find({ userId: args[1] });
                    if(args[2])return message.channel.send({ content: '```json\n' + model + '\n```' });
                    else message.channel.send({ content: `MALICIOUS <Model [${model.length}]>` });
                }else if(args[0] == 'backup') {
                    model = await Model4.find({ guildId: args[1] });
                    let modelToSend = {};
                    modelToSend.guildId = model.guildId;
                    modelToSend.enable = model.enable;
                    modelToSend.password = '*'.repeat(`${model.password}`.length);
                    modelToSend.name = model.name;
                    if(args[2])return message.channel.send({ content: '```json\n {' + JSON.stringify(modelToSend) + '\n```' });
                    else message.channel.send({ content: `BACKUP: <Model [${model.length}]>` });
                }else if(args[0] == 'warnByGuild') {
                    model = await Model5.find({ guildId: args[1] });
                    if(args[2])return message.channel.send({ content: '```json\n' + model + '\n```' });
                    else message.channel.send({ content: `WARN_GUILD: <Model [${model.length}]>` });
                }else if(args[0] == 'warnByUser') {
                    model = await Model5.find({ userId: args[1] });
                    if(args[2])return message.channel.send({ content: '```json\n' + model + '\n```' });
                    else message.channel.send({ content: `WARN_USER: <Model [${model.length}]>` });
                }else{
                    message.channel.send('`Model not found.`');
                }
            }
            catch(e) {
                message.channel.send({ content: '`' + e + '`' });
            }
        }else message.channel.send({ content: '<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Agente oficial.`' });
	},
};