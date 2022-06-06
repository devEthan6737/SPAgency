const Discord = require('discord.js-light');
const { dataRequired } = require("../../functions");
const Warns = require('../../schemas/warnsSchema');
const db = require('megadb');
const warn = new db.crearDB('warns', 'data_guilds');

module.exports = {
	nombre: 'warns',
	category: 'Moderación',
    premium: false,
	alias: ['warn-list', 'avisos', 'warnlist', 'warnslist', 'warns-list'],
	description: 'Mira los avisos de un usuario.',
	usage: ['<prefix>warn-list <userMention>'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.member.permissions.has('MANAGE_MESSAGES'))return message.channel.send(`${LANG.data.permissionsMessages}.`);

        let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('' + LANG.commands.mod.warns.message1 + '.\n\n' + _guild.configuration.prefix + 'warn-list <userMention>'));

        let userWarns = await Warns.findOne({ guildId: message.guild.id, userId: userMention.id });
        if(!userWarns)return message.reply({ content: `${LANG.commands.mod.warns.message2}.` });

        let cc = 1;
        message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`${LANG.commands.mod.warns.message3} ${userWarns.warns.length} ${LANG.commands.mod.warns.message4} <@${userMention.id}>.\n\n${userWarns.warns.map(x => `\`${cc++}-\` __${x.reason}__, ${LANG.commands.mod.warns.message5}: <@${x.moderator}>`).join('\n')}`) ] });
    },
};