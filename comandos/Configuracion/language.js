const Discord = require('discord.js-light');
const { dataRequired } = require("../../functions");
const langs = ['es', 'en'];

module.exports = {
	nombre: 'language',
	category: 'Configuración',
    premium: false,
	alias: ['idioma', 'lang'],
	description: 'Cambia el lenguaje del bot.',
	usage: ['<prefix>language {language}'],
	run: async (client, message, args, _guild) => {
        return message.reply(':flag_es: **El sistema de idiomas es un prototipo muy reciente y no está terminado. La beta estará disponible en poco.**\n\n:flag_us: **The language system is a very recent prototype and is not finished. The beta will be available shortly.**')

        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        try{
            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply({ content: `${LANG.data.permissionsADMINme}.`, ephemeral: true });
            if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.reply({ content: `${LANG.data.permissionsChannelsU}.`, ephemeral: true });
            if(!args[0]) {
                message.reply(await dataRequired('' + LANG.commands.config.language.message1 + '.\n\n' + _guild.configuration.prefix + 'lang <language>'));
                message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor('5c4fff').setDescription(':flag_es: - `es`\n:flag_us: - `en`') ] });
                return;
            }

            if(!langs.includes(args[0]))return message.reply(`${LANG.commands.config.language.message2}.`);

            _guild.configuration.language = args[0];
            _guild.save();
            LANG = require(`../../LANG/${_guild.configuration.language}.json`);
            message.reply(`${LANG.commands.config.language.message3}.`);
        }catch(err) {}
	},
};