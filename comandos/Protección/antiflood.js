const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'antiflood',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Evita muchos mensajes a la vez que inunden un canal.',
	usage: ['<prefix>flood [maxAmountDetect]'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(args[0]) {
            if(isNaN(parseInt(args[0])))return message.reply({ content: `${LANG.commands.protect.antiflood.message1}.` });
            _guild.moderation.automoderator.actions.floodDetect = parseInt(args[0]);
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antiflood.message2}.` });
        }else{
            if(_guild.protection.antiflood == false) {
                _guild.protection.antiflood = true;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: `${LANG.commands.protect.antiflood.message3}.` });
            }else{
                _guild.protection.antiflood = false;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: `${LANG.commands.protect.antiflood.message4}.` });
            }
        }

    },
}