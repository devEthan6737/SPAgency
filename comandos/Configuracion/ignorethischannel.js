const Discord = require('discord.js-light');
const { dataRequired, pulk, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'ignorethischannel',
	category: 'Configuración',
    premium: false,
	alias: ['ignoreThisChannel', 'ignoreChannel', 'ignore'],
	description: 'Haz que el bot ingnore un canal.',
	usage: ['<prefix>ignoreThisChannel {enable, disable}'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        try{
            if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.reply({ content: LANG.data.permissionsChannelsU });
            if(!args[0])return message.reply(await dataRequired(LANG.commands.config.ignorethischannel.message1 + _guild.configuration.prefix + LANG.commands.config.ignorethischannel.message2));

            if(args[0] == 'enable') {
                if(_guild.configuration.ignoreChannels.includes(message.channel.id))return message.reply({ content: LANG.commands.config.ignorethischannel.message3 });
                _guild.configuration.ignoreChannels.push(message.channel.id);
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: LANG.commands.config.ignorethischannel.message4 });
            }else if(args[0] == 'disable') {
                if(_guild.configuration.ignoreChannels.includes(message.channel.id)) {
                    _guild.configuration.ignoreChannels = await pulk(_guild.configuration.ignoreChannels, message.channel.id);
                    updateDataBase(client, message.guild, _guild, true);
                }
                message.reply({ content: LANG.commands.ignorethischannel.message5 });
            }else{
                message.reply(await dataRequired(LANG.commands.ignorethischannel.message6 + _guild.configuration.prefix + LANG.commands.ignorethischannel.message7));
            }
        }catch(err) {}
	},
};