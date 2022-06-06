const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'manyemojis',
	category: 'Moderación',
    premium: false,
	alias: ['manyEmojis', 'many-emojis'],
	description: 'Evita mensajes que incluyan muchos emojis.',
	usage: ['<prefix>manyEmojis [maxAmountDetect]'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');

        if(args[0]) {
            if(isNaN(parseInt(args[0])))return message.reply({ content: 'El argumento no es un número.' });
            _guild.moderation.automoderator.actions.manyEmojis = parseInt(args[0]);
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Dato actualizado con éxito, para recordar: recomendamos mantener este valor en __4__.' });
        }else{
            if(_guild.moderation.dataModeration.events.manyEmojis == false) {
                _guild.moderation.dataModeration.events.manyEmojis = true;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: 'Detector de muchos emojis activado, vuelve a escribir el comando para desactivarlo.\n\nAl escribir de nuevo el comando, puedes adjuntar el número de mensajes que debo recopilar para considerar un evento de muchos emojis.' });
            }else{
                _guild.moderation.dataModeration.events.manyEmojis= false;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: 'Detector de muchos emojis desactivado.' });
            }
        }

    },
}