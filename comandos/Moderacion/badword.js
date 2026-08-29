const Discord = require('discord.js-light');
const { dataRequired, pulk, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'badword',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Haz que el bot borre palabras prohibidas en el servidor.',
	usage: ['<prefix>badword {add <newBadword>, remove, clearAll}'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');
        if(!args[0])return message.reply(await dataRequired('Debes escribir la función del comando.\n\n' + _guild.configuration.prefix + 'badword {add, remove, clearAll}'));

        if(args[0] == 'add') {

            if(!args[1])return message.reply(await dataRequired('Debes escribir la palabra que deseas bloquear.\n\n' + _guild.configuration.prefix + 'badword add <newBadword>'));
            _guild.moderation.dataModeration.badwords.push(args[1].toLowerCase());
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `He agregado la palabra \`${args[1].toLowerCase()}\` a la lista.` });

        }else if(args[0] == 'remove') {

            if(_guild.moderation.dataModeration.badwords.length == 0)return message.reply({ content: 'No hay malas palabras en la lista.' });
            let cc = 1;
            message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`Estás viendo las malas palabras del servidor, después de este mensaje escribe el numero adjunto a la mala palabra para eliminarla.\n\n${_guild.moderation.dataModeration.badwords.map(x => `\`${cc++}-\` ${x}`).join('\n')}`) ] }).catch(err => {});
            let collector = message.channel.createMessageCollector({ time: 15000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {                    
                    if(isNaN(m.content)) {
                        message.reply('Eso no era un número.');
                        return collector.stop();
                    }
                    if(m.content > _guild.moderation.dataModeration.badwords) {
                        message.reply('No he encontrado un número tan alto de malas palabras.');
                        return collector.stop();
                    }

                    message.channel.send({ content: `La palabra número ${m.content}, "${_guild.moderation.dataModeration.badwords[m.content - 1]}", ha sido eliminada.` });
                    _guild.moderation.dataModeration.badwords = await pulk(_guild.moderation.dataModeration.badwords, _guild.moderation.dataModeration.badwords[m.content - 1]);
                    updateDataBase(client, message.guild, _guild, true);
                    collector.stop();
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: 'Colector detenido.' });
            });

        }else if(args[0] == 'clearAll') {
            _guild.moderation.dataModeration.badwords = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Lista de malas palabras limpiada.' });
        }else{
            message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'badword {add, remove, clearAll}'));
        }
    },
};