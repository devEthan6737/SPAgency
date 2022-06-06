const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'ownsystem',
	category: 'Protección',
    premium: true,
	alias: [],
	description: 'Activa o desactiva un sistema que puedes personalizar completamente a tu gusto.',
	usage: ['<prefix>ownsystem'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.ownSystem.enable == false) {
            _guild.protection.ownSystem.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.ownsystem.message1}.` });
        }else{
            _guild.protection.ownSystem.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.ownsystem.message2}.` });
        }

    },
}