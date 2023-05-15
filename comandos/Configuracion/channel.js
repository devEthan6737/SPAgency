const { dataRequired } = require("../../functions");

module.exports = {
	nombre: 'channel',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Gestiona los canales de tu servidor de forma más rápida.',
	usage: ['<prefix>channel {create <channelName>, delete <channelMention>}'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        try{
            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply({ content: LANG.data.permissionsADMINme, ephemeral: true });
            if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.reply({ content: LANG.data.permissionsChannelsU, ephemeral: true });
            if(!args[0])return message.reply(await dataRequired(LANG.commands.config.channel.message1 + _guild.configuration.prefix + LANG.commands.config.channel.message2));

            if(args[0] == 'create') {
                if(!args[1])return message.reply(await dataRequired(LANG.commands.config.channel.message3 + _guild.configuration.prefix + LANG.commands.config.channel.message4));
                message.guild.channels.create(args.join(' ').split('create')[1]);
                message.reply({ content: LANG.commands.config.channel.message5, ephemeral: true });
            }else if(args[0] == 'delete') {
                let channelMention = message.mentions.channels.first();
                if(!channelMention)return message.reply(await dataRequired(LANG.commands.config.channel.message6 + _guild.configuration.prefix + LANG.commands.config.channel.message7));
                if(message.guild.channels.cache.has(channelMention.id)) {
                    if(!channelMention.parentId)return message.reply(LANG..commands.config.channel.message11);
                    channelMention.delete().catch(err => {});
                    message.reply({ content: LANG.commands.config.channel.message8, ephemeral: true });
                }else{
                    message.reply(await dataRequired(LANG.commands.config.channel.message9 + _guild.configuration.prefix + LANG.commands.config.channel.message7));
                }
            }else{
                message.reply(await dataRequired(LANG.commands.config.channel.message10 + _guild.configuration.prefix + LANG.commands.config.channel.message2));
            }
        }catch(err) {}
	},
};
