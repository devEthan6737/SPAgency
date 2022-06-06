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
        try{
            if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.reply({ content: 'Necesitas permisos de __Gestionar Canales__.', ephemeral: true });
            if(!args[0])return message.reply(await dataRequired('No has especificado la función del comando.\n\n' + _guild.configuration.prefix + 'ignoreThisChannel {enable, disable}'));

            if(args[0] == 'enable') {
                if(_guild.configuration.ignoreChannels.includes(message.channel.id))return message.reply({ content: 'Ya estoy ignorando este canal.' });
                _guild.configuration.ignoreChannels.push(message.channel.id);
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: 'A partir de ahora ignoraré este canal (Este comando seguirá operativo).', ephemeral: true });
            }else if(args[0] == 'disable') {
                if(_guild.configuration.ignoreChannels.includes(message.channel.id)) {
                    _guild.configuration.ignoreChannels = await pulk(_guild.configuration.ignoreChannels, message.channel.id);
                    updateDataBase(client, message.guild, _guild, true);
                }
                message.reply({ content: 'Dejaré de ignorar este canal.', ephemeral: true });
            }else{
                message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'ignoreThisChannel {enable, disable}'));
            }
        }catch(err) {}
	},
};