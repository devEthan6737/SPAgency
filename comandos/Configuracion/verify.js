const { dataRequired } = require("../../functions");

module.exports = {
	nombre: 'verify',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Verifica a un usuario nuevo en tu servidor.',
	usage: ['<prefix>verify <userMention>'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        try{
            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply({ content: LANG.data.permissionsADMINme });
            if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply({ content: LANG.data.permissionsManageRoles });

            let member = message.mentions.members.first();
            if(!member)return message.reply(await dataRequired(LANG.commands.config.verify.message1 + '\n\n' + _guild.configuration.prefix + 'verify <userMention>'));

            if(_guild.protection.verification.enable == false)return message.reply(LANG.commands.config.verify.message2);
            if(member.roles.cache.has(_guild.protection.verification.role))return message.reply(LANG.commands.config.verify.message3);
            member.roles.add(_guild.protection.verification.role);
            message.reply(LANG.commands.config.verify.message4);
        }catch(err) {}
	},
};
