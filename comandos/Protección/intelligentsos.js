const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'intelligentsos',
	category: 'Protección',
    premium: true,
	alias: [],
	description: 'Si el bot lo ve necesario, enviará un SOS al personal de SP Agency.',
	usage: ['<prefix>intelligentsos'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.intelligentSOS.enable == false) {
            _guild.protection.intelligentSOS.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.intelligentsos.message2}.` });
        }else{
            _guild.protection.intelligentSOS.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.intelligentsos.message2}.` });
        }

    },
}