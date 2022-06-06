const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'purge-webhooks-attacks',
	category: 'Protección',
    premium: false,
	alias: ['pwa', 'antiwebhooks'],
	description: 'Haz que el bot detenga todos los posibles raids detectados en el servidor.',
	usage: ['<prefix>purgeWebhooksAttacks'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(_guild.protection.purgeWebhooksAttacks.enable == false) {
            _guild.protection.purgeWebhooksAttacks.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.pwa.message1}.` });
        }else{
            _guild.protection.purgeWebhooksAttacks.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.pwa.message2}.` });
        }

    },
}