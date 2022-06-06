const Discord = require('discord.js-light');

module.exports = {
	nombre: 'nuke',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Elimina todos los mensajes de un canal.',
	usage: ['<prefix>nuke'],
	run: async (client, message) => {
		if(!message.guild.me.permissions.has('MANAGE_CHANNELS')) return message.channel.send('Necesito permiso de __Gestionar Canales__.');
		if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.channel.send('Necesitas permisos de __Gestionar Canales__.');

        message.reply({ content: 'Estoy a punto de clonar este canal, ¡La acción es irreversible!\n\n¿Sabes lo que haces? Si estás seguro escribe `Seguro`' });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {
                if(m.content.toLowerCase() == 'seguro') {
                    message.channel.clone({ parent: message.channel.parentId, positon: message.channel.position }).then(nuke => {
                        message.channel.delete();
                        nuke.setPosition(message.channel.position).then(terminado => {
                            terminado.send({ content: '✅ | `Canal nukeado con éxito.`' });
                        });
                    });
                    collector.stop();
                }else{
                    collector.stop();
                }
            }
        });
        collector.on('end', () => {
            message.channel.send({ content: 'Colector detenido.' });
        });
	},
};