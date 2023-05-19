const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
    nombre: "setprefix",
    category: "Configuración",
    premium: false,
    alias: ['prefix', 'editprefix', 'newprefix', 'changeprefix'],
    description: "Cambia el prefijo del bot.",
    usage: ['<prefix>setprefix <newPrefix>'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: LANG.data.permissionsADMIN });
        if(!args[0])return message.reply(await dataRequired(LANG.commands.setprefix.message1 + _guild.configuration.prefix + LANG.commands.setprefix.message2));
        if(args[0].length > 3)return message.reply(LANG.commands.setprefix.message3);
        _guild.configuration.prefix = args[0];
        updateDataBase(client, message.guild, _guild, true);
        message.reply({ content: `> Prefijo actualizado a \`${args[0]}\`` });
        client.channels.cache.get(process.env.BOT_PRIVATE_LOGS).send(LANG.commands.setprefix.message4.replace('<prefix>', args[0]).replace('<guildName>', message.guild.name).replace('<guildId>', message.guild.id));
    }
}
