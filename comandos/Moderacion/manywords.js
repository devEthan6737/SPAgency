const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'manywords',
	category: 'Moderación',
    premium: false,
	alias: ['manyWords', 'many-words'],
	description: 'Evita mensajes que incluyan muchos caracteres.',
	usage: ['<prefix>manyWords [maxAmountDetect]'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');

        if(args[0]) {
            if(isNaN(parseInt(args[0])))return message.reply({ content: 'El argumento no es un número.' });
            _guild.moderation.automoderator.actions.manyWords = parseInt(args[0]);
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Dato actualizado con éxito, para recordar: recomendamos mantener este valor en __250__.' });
        }else{
            if(_guild.moderation.dataModeration.events.manyWords == false) {
                _guild.moderation.dataModeration.events.manyWords = true;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: 'Detector de mensajes con muchos caracteres activado, vuelve a escribir el comando para desactivarlo.\n\nAl escribir de nuevo el comando, puedes adjuntar el número de mensajes que debo recopilar para considerar un evento de un mensaje con muchos caracteres.' });
            }else{
                _guild.moderation.dataModeration.events.manyWords = false;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: 'Detector de mensajes con muchos caracteres desactivado.' });
            }
        }

    },
}