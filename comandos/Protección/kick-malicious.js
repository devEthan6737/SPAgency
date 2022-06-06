const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'kick-malicious',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Si un usuario malicioso entra en el servidor será expulsado, si insiste en entrar lo banearé.',
	usage: ['<prefix>kick-malicious'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.kickMalicious.enable == false) {
            _guild.protection.kickMalicious.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.kickmalicious.message1}.` });
        }else{
            _guild.protection.kickMalicious.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.kickmalicious.message2}.` });
        }

    },
}