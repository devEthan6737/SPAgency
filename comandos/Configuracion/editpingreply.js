const Discord = require('discord.js-light');

module.exports = {
	nombre: 'editpingreply',
	category: 'Configuración',
    premium: false,
	alias: ['epr', 'editPingReply'],
	description: 'Elige el mensaje que SP Agency enviará al ser mencionado.',
	usage: ['<prefix>editPingReply'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: LANG.data.permissionsADMIN });
        message.channel.send({
            embeds: [
                new Discord.MessageEmbed().setColor(0x0056ff).setDescription(LANG.commands.config.editpingreply.message1)
            ],
            components: [
                new Discord.MessageActionRow().addComponents(new Discord.MessageSelectMenu().setCustomId('chooseOption').setPlaceholder(LANG.commands.config.editpingreply.message2).addOptions([
                    {
                        label: LANG.commands.config.editpingreply.message3[0][0],
                        description: LANG.commands.config.editpingreply.message3[0][1],
                        value: 'allDetails',
                    },
                    {
                        label: LANG.commands.config.editpingreply.message3[1][0],
                        description: LANG.commands.config.editpingreply.message3[1][1],
                        value: 'pingLessDetails',
                    },
                    {
                        label: LANG.commands.config.editpingreply.message3[2][0],
                        description: LANG.commands.config.editpingreply.message3[2][1],
                        value: 'onlySupportServer',
                    },
                    {
                        label: LANG.commands.config.editpingreply.message3[3][0],
                        description: LANG.commands.config.editpingreply.message3[3][1],
                        value: 'ignore',
                    }
                ]))
            ]
        });
    },
};