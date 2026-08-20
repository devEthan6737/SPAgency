const Discord = require('discord.js');
const helpOptions = new Discord.MessageActionRow().addComponents(new Discord.MessageSelectMenu().setCustomId('helpOptions').setPlaceholder('Nada seleccionado.').addOptions([
    {
        emoji: '❓',
        label: '¿Qué es SP Agency?',
        description: '¿Qué somos? ¿Qué hacemos? ¿Cómo lo hacemos? Aquí te lo explicamos.',
        value: 'ho_qespa',
    },
    {
        emoji: '🤖',
        label: '¿SP Agency es un buen bot antiraider?',
        description: '¿SPA promete lo que dice?',
        value: 'ho_spaeubba',
    },
    {
        emoji: '👨‍💻',
        label: 'Datos del bot.',
        description: 'Obtén información de terminal.',
        value: 'ho_ddb',
    }
]));

module.exports = {
    nombre: "ayuda",
    category: "Otros",
    premium: false,
    alias: ['help'],
    description: "¿Necesitas ayuda? Nosotros te cuidamos.",
    usage: ['<prefix>ayuda'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        message.reply({ content: `${LANG.commands.others.ayuda.message1}`, components: [ helpOptions ], ephemeral: true });
    }
}