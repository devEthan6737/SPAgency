const Discord = require('discord.js-light');
const ms = require('ms');
const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
    nombre: "bloq-new-created-users",
    category: "Protección",
    premium: false,
    alias: ['bloqnewcreatedusers', 'bncu'],
    description: "Haz que solo usuarios con determinado tiempo en Discord puedan entrar a tu servidor.",
    usage: ['<prefix>bloqnewcreatedusers <time>'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(!args[0])return message.reply(await dataRequired('' + LANG.commands.protect.bncu.message1 + '.\n\n' + _guild.configuration.prefix + 'bncu <time>'));
        let time = ms(args[0]);
        if(!time)return message.reply('`Error 006`: No time typed.');
        if(time < 300000) {
            time = 300000;
            args[0] = '5m';
        }
            
        _guild.protection.bloqNewCreatedUsers.time = ms(time);
        _guild.protection.bloqNewCreatedUsers.enable = true;
        updateDataBase(client, message.guild, _guild, true);
        message.reply({ content: `${LANG.commands.protect.bncu.message2} \`${ms(time)}\`, ${LANG.commands.protect.bncu.message3}.` });
    },
}