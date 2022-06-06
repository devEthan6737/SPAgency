const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
    nombre: "setprefix",
    category: "Configuración",
    premium: false,
    alias: ['prefix', 'editprefix', 'newprefix', 'changeprefix'],
    description: "Cambia el prefijo del bot.",
    usage: ['<prefix>setprefix <newPrefix>'],
    run: async (client, message, args, _guild) => {
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
        if(!args[0])return message.reply(await dataRequired('No has especificado el nuevo prefijo.\n\n' + _guild.configuration.prefix + 'setprefix <newPrefix>'));
        if(args[0].length > 3)return message.reply('¡Ese prefijo es muy largo!');
        _guild.configuration.prefix = args[0];
        updateDataBase(client, message.guild, _guild, true);
        message.reply({ content: `> Prefijo actualizado a \`${args[0]}\`` });
        client.channels.cache.get('822642829335593081').send(`Prefix actualizado a \`${args[0]}\` en **${message.guild.name}** (${message.guild.id})`);
    }
}