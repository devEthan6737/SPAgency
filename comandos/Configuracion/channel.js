const { dataRequired } = require("../../functions");

module.exports = {
	nombre: 'channel',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Gestiona los canales de tu servidor de forma más rápida.',
	usage: ['<prefix>channel {create <channelName>, delete <channelMention>}'],
	run: async (client, message, args, _guild) => {
        try{
            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply({ content: 'Necesito permiso de __Administrador__.', ephemeral: true });
            if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.reply({ content: 'Necesitas permisos de __Gestionar Canales__.', ephemeral: true });
            if(!args[0])return message.reply(await dataRequired('No has especificado la función del comando.\n\n' + _guild.configuration.prefix + 'channel {create <channelName>, delete <channelMention>}'));

            if(args[0] == 'create') {
                if(!args[1])return message.reply(await dataRequired('No has escrito el nombre del nuevo canal.\n\n' + _guild.configuration.prefix + 'channel create <channelName>'));
                message.guild.channels.create(args.join(' ').split('create')[1]);
                message.reply({ content: 'Canal creado.', ephemeral: true });
            }else if(args[0] == 'delete') {
                let channelMention = message.mentions.channels.first();
                if(!channelMention)return message.reply(await dataRequired('Necesitas mencionar un canal.\n\n' + _guild.configuration.prefix + 'channel delete <channelMention>'));
                if(message.guild.channels.cache.has(channelMention.id)) {
                    if(!channelMention.parentId)return message.reply('`Error 003`: Channel must be on this guild.');
                    channelMention.delete().catch(err => {});
                    message.reply({ content: 'Canal borrado.', ephemeral: true });
                }else{
                    message.reply(await dataRequired('¡El canal mencionado debe estar en este servidor!\n\n' + _guild.configuration.prefix + 'delete <channelMention>'));
                }
            }else{
                message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'channel {create <channelName>, delete <channelMention>}'));
            }
        }catch(err) {}
	},
};