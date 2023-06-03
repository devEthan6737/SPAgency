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

        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!args[0])return message.reply(await dataRequired(LANG.commands.mod.support.message1 + _guild.configuration.prefix + LANG.commands.mod.support.message2));
        let d = await dev.datos();

        if(args[0] == 'sos') {

            if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send({ content: LANG.data.permissionsADMINme });
            if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send({ content: LANG.data.permissionsADMIN });
            if(d.array.length <= 0)return message.reply({ content: LANG.commands.mod.support.message3 });

            let chooseDev = d.array[Math.floor(Math.random() * d.array.length)];
            await client.users.fetch(chooseDev);
            let developer = await client.users.cache.get(chooseDev);
            message.reply({ content: LANG.commands.mod.support.message4 });
            let collector = message.channel.createMessageCollector({ time: 15000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {
                    if(m.content.toLowerCase() == 'seguro') {
                        if(d.array.length <= 0)return message.reply({ content: LANG.commands.mod.support.message5 });
                        message.reply({ content: LANG.commands.mod.support.message5 + '(`<@' + chooseDev + '>`)`' });
                        let invite = await message.guild.channels.cache.filter(m => m.type == 'GUILD_TEXT').random().createInvite();
                        if(invite == undefined)return message.channel.send({ content: LANG.commands.mod.support.message7 });
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

            if(d.array.length <= 0)return message.reply({ content: LANG.commands.mod.support.message5 });
            let chooseDev = d.array[Math.floor(Math.random() * d.array.length)];
            await client.users.fetch(chooseDev);
            let developer = await client.users.cache.get(chooseDev);
            let _support = await Support.findOne({ fetchAutor: message.author.id });
            if(_support)return message.reply({ content: LANG.commands.mod.support.message8});

            message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('YELLOW').setDescription(LANG.commands.mod.support.message9 + '`' + developer.tag + '`.') ] }).catch(err => {
                message.channel.send({ content: LANG.commands.mod.support.message10 });
            });

            developer.send({ embeds: [ new Discord.MessageEmbed().setColor('YELLOW').setDescription(`[<a:sp_loading:805810562349006918>] **Conectando conversación con** \`${message.author.tag}\`.`) ] }).catch(err => {
                message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(LANG.commands.mod.support.message11 + '`' + developer.tag + '`.') ] }).catch(() => {});
            });

            message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('GREEN').setDescription('[→] `' + developer.tag + '`' + LANG.commands.mod.support.message12) ] }).catch(() => {});
            message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('BLUE').setDescription(LANG.commands.mod.support.message13 + '`' + developer.tag + '`' + LANG.commands.mod.support.message14) ] }).catch(() => {});
            developer.send({ embeds: [ new Discord.MessageEmbed().setColor('GREEN').setDescription(`[→] \`${message.author.tag} (${message.author.id})\` **se ha conectado a la conversación**.`) ] }).catch(err => {});
            developer.send({ embeds: [ new Discord.MessageEmbed().setColor('BLUE').setDescription(`[👁 Solo tú puedes verlo] **\`${message.author.tag}\` ha iniciado una conversación privada-internacional contigo, un personal de la agencia**. **El usuario consultará todo lo que deba y usted como staff de SP Agency deberá tratarlo con respeto en todo momento**.\n\n**Para cerrar el chat escribe** \`sp!close\` **aquí, el usuario también puede cerrar el chat**.`) ] }).catch(() => {});
            message.reply({ content: LANG.commands.mod.support.message15 });

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
            message.channel.send({ content: LANG.commands.mod.support.message16 + 'https://discord.gg/m5p3QvJePD' });
        }else{
            message.reply(await dataRequired(LANG.commands.mod.support.message17 + _guild.configuration.prefix + LANG.commands.mod.support.message2));
        }
    },
};