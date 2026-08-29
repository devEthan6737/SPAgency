const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'intelligent-antiflood',
	category: 'Protección',
    premium: false,
	alias: ['intelligentAntiflood', 'intelligentantiflood', 'iflood', 'iantiflood'],
	description: 'Evita mensajes repetidos.',
	usage: ['<prefix>iflood'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(_guild.protection.intelligentAntiflood == false) {
            _guild.protection.intelligentAntiflood = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.iAntiflood.message1}.` });
        }else{
            _guild.protection.intelligentAntiflood = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.iAntiflood.message2}.` });
        }

    },
}