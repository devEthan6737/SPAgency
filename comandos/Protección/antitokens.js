const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'antitokens',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Los usuarios considerados como usuarios zombies (Selfbots o bots que se hacen pasar por humanos) serán expulsados/baneados del servidor al unirse a este.',
	usage: ['<prefix>antitokens'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);
    
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.antitokens.enable == false) {
            _guild.protection.antitokens.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antitokens.message1}.` });
        }else{
            if(_guild.protection.verification._type == '--v4')return message.channel.send({ content: `${LANG.commands.protect.antitokens.message2}.` });
            _guild.protection.antitokens.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antitokens.message3}.` });
        }

    },
}