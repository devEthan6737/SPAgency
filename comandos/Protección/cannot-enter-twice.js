const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'cannot-enter-twice',
	category: 'Protección',
    premium: true,
	alias: ['cannotenter-twice'],
	description: 'Evita dos entradas del mismo usuario en tu servidor.',
	usage: ['<prefix>antijoins'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.cannotEnterTwice.enable == false) {
            _guild.protection.cannotEnterTwice.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.cet.message1}.` });
        }else{
            _guild.protection.cannotEnterTwice.enable = false;
            _guild.protection.cannotEnterTwice.users = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.cet.message2}.` });
        }

    },
}