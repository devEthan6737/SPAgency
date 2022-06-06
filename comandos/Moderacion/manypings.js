const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'manypings',
	category: 'Moderación',
    premium: false,
	alias: ['manyPings', 'many-pings'],
	description: 'Evita mensajes que incluyan muchas menciones.',
	usage: ['<prefix>manyPings [maxAmountDetect]'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');

        if(args[0]) {
            if(isNaN(parseInt(args[0])))return message.reply({ content: 'El argumento no es un número.' });
            _guild.moderation.automoderator.actions.manyPings = parseInt(args[0]);
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Dato actualizado con éxito, para recordar: recomendamos mantener este valor en __4__.' });
        }else{
            if(_guild.moderation.dataModeration.events.manyPings == false) {
                _guild.moderation.dataModeration.events.manyPings = true;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: 'Detector de muchas menciones activado, vuelve a escribir el comando para desactivarlo.\n\nAl escribir de nuevo el comando, puedes adjuntar el número de mensajes que debo recopilar para considerar un evento de muchas menciones.' });
            }else{
                _guild.moderation.dataModeration.events.manyPings = false;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: 'Detector de muchas menciones desactivado.' });
            }
        }

    },
}