const { dataRequired, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'logs',
	category: 'Configuración',
    premium: false,
	alias: ['setlogs', 'setLogs'],
	description: 'Registra eventos en tu servidor dentro de un canal.',
	usage: ['<prefix>logs {enable <channelMention>, disable}'],
	run: async (client, message, args, _guild) => {
        if(!message.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
        if(!args[0])return message.reply(await dataRequired('No has escrito el tipo de función.\n\n' + _guild.configuration.prefix + 'logs {enable <channelMention>, disable}'));
        
        if(args[0] == 'enable') {
            if(_guild.configuration.logs[0])return message.reply({ content: 'Los logs ya estaban activos.', ephemeral: true });
            let channelMention = message.mentions.channels.first();
            if(!channelMention)return message.reply(await dataRequired('Necesitas mencionar un canal de texto.\n\n' + _guild.configuration.prefix + 'logs enable <channelMention>'));
            if(channelMention.type != 'GUILD_TEXT')return message.reply(await dataRequired('.Necesitas mencionar un canal de texto.\n\n' + _guild.configuration.prefix + 'logs enable <channelMention>'));
            if(message.guild.channels.cache.has(channelMention.id)) {
                if(!channelMention.parentId)return message.reply('`Error 003`: Channel must be on this guild.');
                _guild.configuration.logs = [ channelMention.id, message.channel.id ];
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: 'Los logs han sido activados correctamente.', ephemeral: true });
            }else{
                message.reply(await dataRequired('¡El canal mencionado debe estar en este servidor!\n\n' + _guild.configuration.prefix + 'logs enable <channelMention>'));
            }
        }else if(args[0] == 'disable') {
            if(!_guild.configuration.logs[0])return message.reply({ content: 'Los logs no estaban activos.', ephemeral: true });
            _guild.configuration.logs = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Los logs han sido desactivados correctamente.', ephemeral: true });
        }else{
            message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'logs {enable <channelMention>, <disable>'));
        }
	},
};