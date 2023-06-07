const { dataRequired, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'logs',
	category: 'Configuración',
    premium: false,
	alias: ['setlogs', 'setLogs'],
	description: 'Registra eventos en tu servidor dentro de un canal.',
	usage: ['<prefix>logs {enable <channelMention>, disable}'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: LANG.data.permissionsADMINme });
        if(!args[0])return message.reply(await dataRequired(LANG.commands.config.logs.message1 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.logs.message2));
        
        if(args[0] == 'enable') {
            if(_guild.configuration.logs[0])return message.reply(LANG.commands.config.logs.message3);
            let channelMention = message.mentions.channels.first();
            if(!channelMention)return message.reply(await dataRequired(LANG.commands.config.logs.message4 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.logs.message1));
            if(channelMention.type != 'GUILD_TEXT')return message.reply(await dataRequired(LANG.commands.config.logs.message5 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.logs.message1));
            if(message.guild.channels.cache.has(channelMention.id)) {
                if(!channelMention.parentId)return message.reply(LANG.commands.config.logs.message6);
                _guild.configuration.logs = [ channelMention.id, message.channel.id ];
                updateDataBase(client, message.guild, _guild, true);
                message.reply(LANG.commands.config.logs.message7);
            }else{
                message.reply(await dataRequired(LANG.commands.config.logs.message8 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.logs.message1));
            }
        }else if(args[0] == 'disable') {
            if(!_guild.configuration.logs[0])return message.reply(LANG.commands.config.logs.message9);
            _guild.configuration.logs = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply(LANG.commands.config.logs.message10);
        }else{
            message.reply(await dataRequired(LANG.commands.config.logs.message11 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.logs.message1));
        }
	},
};