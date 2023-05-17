const Discord = require('discord.js-light');

module.exports = { 
	nombre: 'nuke',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Elimina todos los mensajes de un canal.',
	usage: ['<prefix>nuke'],
	run: async (client, message) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('MANAGE_CHANNELS')) return message.channel.send(LANG.data.permissionsChannelsMe);
		if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.channel.send(LANG.data.permissionsChannelsU);

        message.reply({ content: LANG.commands.mod.nuke.message1 });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {
                if(m.content.toLowerCase() == 'seguro') {
                    message.channel.clone({ parent: message.channel.parentId, positon: message.channel.position }).then(nuke => {
                        message.channel.delete();
                        nuke.setPosition(message.channel.position).then(terminado => {
                            terminado.send({ content: '✅ | ' + LANG.commands.mod.nuke.message2 });
                        });
                    });
                    collector.stop();
                }else{
                    collector.stop();
                }
            }
        });
        collector.on('end', () => {
            message.channel.send({ content: LANG.commands.mod.nuke.message3 });
        });
	},
};