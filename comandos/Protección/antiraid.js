const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'antiraid',
	category: 'Protección',
    premium: false,
	alias: ['raiddetect'],
	description: 'Haz que el bot detenga todos los posibles raids detectados en el servidor.',
	usage: ['<prefix>antiraid'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(_guild.protection.antiraid.enable == false) {
            _guild.protection.antiraid.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antiraid.message1}.` });

            message.guild.roles.cache.forEach(role => {
                if(!role.managed && role.mentionable) role.edit({
                    mentionable: false
                }).catch();
            });
        }else{
            _guild.protection.antiraid.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antiraid.message2}.` });
        }

    },
}