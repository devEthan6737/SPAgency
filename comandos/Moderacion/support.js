const Discord = require('discord.js-light');
const Support = require('../../schemas/supportSchema');
const { dataRequired } = require("../../functions");
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'support',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Obtén tres tipos de soporte eficientes.',
	usage: ['<prefix>support {sos, contact, server}'],
    run: async (client, message, args, _guild) => {
        if(!args[0])return message.reply(await dataRequired('Debes escribir la función del comando.\n\n' + _guild.configuration.prefix + 'support {sos, contact, server}'));
        let d = await dev.datos();

        if(args[0] == 'sos') {

            if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
            if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');
            if(d.array.length <= 0)return message.reply({ content: '🆘 | ¡No hay developers disponibles!' });

            let chooseDev = d.array[Math.floor(Math.random() * d.array.length)];
            await client.users.fetch(chooseDev);
            let developer = await client.users.cache.get(chooseDev);
            message.reply({ content: 'Estoy a punto de avisar a un personal oficial de SP Agency, ¡La acción es irreversible!\n\n¿Sabes lo que haces? Si es así escribe `Seguro`' });
            let collector = message.channel.createMessageCollector({ time: 15000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {
                    if(m.content.toLowerCase() == 'seguro') {
                        if(d.array.length <= 0)return message.reply({ content: '🆘 | ¡No hay personal disponible!' });
                        message.reply({ content: '<a:sp_loading:805810562349006918> | `¡Entendido! He avisado a un staff activo (`<@' + chooseDev + '>`)`' });
                        let invite = await message.guild.channels.cache.filter(m => m.type == 'GUILD_TEXT').random().createInvite();
                        if(invite == undefined)return message.channel.send('Error, no he podido crear la invitación de este servidor.');
                        developer.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`🆘 | \`S.O.S EN ${message.guild.name} (${message.guild.id})\`\n\n[ÚNETE](${invite})`) ] }).catch(err => {});
                        collector.stop();
                    }else{
                        collector.stop();
                    }
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: 'Colector detenido.' });
            });

        }else if(args[0] == 'contact') {

            if(d.array.length <= 0)return message.reply({ content: '🆘 | ¡No hay personal disponible!' });
            let chooseDev = d.array[Math.floor(Math.random() * d.array.length)];
            await client.users.fetch(chooseDev);
            let developer = await client.users.cache.get(chooseDev);
            let _support = await Support.findOne({ fetchAutor: message.author.id });
            if(_support)return message.reply({ content: 'Primero debes terminar el chat actual por privado, usando `sp!close`'});

            message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('YELLOW').setDescription(`[<a:sp_loading:805810562349006918>] **Intentando conectar con** \`${developer.tag}\`.`) ] }).catch(err => {
                message.channel.send({ content: 'Error, abre tu md.' });
            });

            developer.send({ embeds: [ new Discord.MessageEmbed().setColor('YELLOW').setDescription(`[<a:sp_loading:805810562349006918>] **Conectando conversación con** \`${message.author.tag}\`.`) ] }).catch(err => {
                message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[↜] **Error al conectar con** \`${developer.tag}\`.`) ] }).catch(err => {});
            });

            message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('GREEN').setDescription(`[→] \`${developer.tag}\` **se ha conectado a la conversación**.`) ] }).catch(err => {});
            message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('BLUE').setDescription(`[👁 Solo tú puedes verlo] **Has iniciado una conversación privada-internacional con un staff oficial de la agencia** \`${developer.tag}\`, **consulta lo que debas y trátalo con respeto (Esta conversación será almacenada)**.\n\n**Para cerrar el chat escribe** \`sp!close\` **aquí, el staff también puede cerrar el chat**.`) ] }).catch(err => {});
            developer.send({ embeds: [ new Discord.MessageEmbed().setColor('GREEN').setDescription(`[→] \`${message.author.tag} (${message.author.id})\` **se ha conectado a la conversación**.`) ] }).catch(err => {});
            developer.send({ embeds: [ new Discord.MessageEmbed().setColor('BLUE').setDescription(`[👁 Solo tú puedes verlo] **\`${message.author.tag}\` ha iniciado una conversación privada-internacional contigo, un personal de la agencia**. **El usuario consultará todo lo que deba y usted como staff de SP Agency deberá tratarlo con respeto en todo momento**.\n\n**Para cerrar el chat escribe** \`sp!close\` **aquí, el usuario también puede cerrar el chat**.`) ] }).catch(err => {});
            message.reply({ content: 'He iniciado una conversación con un staff de la Agencia.' });

            let newChat = new Support({
                fetchAutor: message.author.id,
                fetchStaff: developer.id,
                staff: {
                    id: developer.id,
                    tag: developer.tag
                },
                author: {
                    id: message.author.id,
                    tag: message.author.tag
                }
            });
            newChat.save();
            dev.extract('array', chooseDev);

        }else if(args[0] == 'server') {
            message.channel.send({ content: 'Este es mi servidor de soporte `24/7`: https://discord.gg/RuBvM5r9eM' });
        }else{
            message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'support {sos, contact, server}'));
        }
    },
};