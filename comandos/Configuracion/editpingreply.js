const Discord = require('discord.js-light');
const chooseOption = new Discord.MessageActionRow().addComponents(new Discord.MessageSelectMenu().setCustomId('chooseOption').setPlaceholder('Seleccionar detalles forzados.').addOptions([
    {
        label: 'Todos los detalles.',
        description: 'El bot mostrará todos los datos necesarios.',
        value: 'allDetails',
    },
    {
        label: 'Menos detalles.',
        description: 'El bot mostrará los detalles mínimos.',
        value: 'pingLessDetails',
    },
    {
        label: 'Solo el servidor de soporte.',
        description: 'El bot solo enviará el servidor de su soporte.',
        value: 'onlySupportServer',
    },
    {
        label: 'Nada.',
        description: '[Premium] Ignorar los pings al completo.',
        value: 'ignore',
    }
]));

module.exports = {
	nombre: 'editpingreply',
	category: 'Configuración',
    premium: false,
	alias: ['epr', 'editPingReply'],
	description: 'Elige el mensaje que SP Agency enviará al ser mencionado.',
	usage: ['<prefix>editPingReply'],
	run: async (client, message, args, _guild) => {
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: 'Necesitas permisos de __Administrador__.' });
        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription('Elige el tipo de mensaje que enviaré cuando sea mencionado.') ], components: [ chooseOption ] });
    },
};