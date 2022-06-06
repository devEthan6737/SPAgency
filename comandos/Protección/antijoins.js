const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'antijoins',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Con el sistema activo, SP Agency expulsará/baneará todas las entradas de usuarios detectadas.',
	usage: ['<prefix>antijoins'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);
    
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.antijoins.enable == false) {
            _guild.protection.antijoins.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antijoins.message1}.` });
        }else{
            _guild.protection.antijoins.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antijoins.message2}.` });
        }

    },
}