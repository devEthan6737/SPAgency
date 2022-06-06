const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');

module.exports = {
	nombre: 'unban',
	category: 'Moderación',
    premium: false,
	alias: ['desbanear'],
	description: 'Desbanea a un usuario de tu servidor.',
	usage: ['<prefix>unban <userId>'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('BAN_MEMBERS'))return message.channel.send(`${LANG.data.permissionsBanMe}.`);
        if(!message.member.permissions.has('KICK_MEMBERS'))return message.channel.send(`${LANG.data.permissionsBan}.`);

        if(!args[0])return message.reply(await dataRequired('' + LANG.commands.mod.unban.message1 + '.\n\n' + _guild.configuration.prefix + 'unban <userId>'));

        let userID = client.users.cache.get(args[0]);
        if(!userID)return message.reply('`Error 005`: Cannot fetch this user.');
        message.guild.members.unban(args[0]).catch(err => {
            message.channel.send(err);
        });
        try{
            message.reply({ content: `${LANG.commands.mod.unban.message2} \`${userID.tag}\`` });
        }catch(err) {
            message.reply({ content: `${LANG.commands.mod.unban.message3}.` });
        }
	},
};