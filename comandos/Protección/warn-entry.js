const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'warn-entry',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Avisaré por privado al propietario del servidor cuando un usuario malicioso se una al servidor.',
	usage: ['<prefix>warn-entry'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.warnEntry == false) {
            _guild.protection.warnEntry = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect["warn-entry"].message1}.` });
        }else{
            _guild.protection.warnEntry = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect["warn-entry"].message2}.` });
        }

    },
}