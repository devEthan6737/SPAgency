const Discord = require('discord.js-light');
const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
	nombre: '2fa',
	category: 'Protección',
    premium: false,
	alias: ['setpassword', 'set2fa'],
	description: 'Bloquea los comandos del bot en tu servidor con una contraseña.',
	usage: ['<prefix>2fa {enable <password>, disable}'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(args[0] == 'enable') {
            if(_guild.configuration.password.enable == false) {
                if(!args[1])return message.reply(await dataRequired('' + LANG.commands.protect['2fa'].message1 + '.\n\n' + _guild.configuration.prefix + '2fa enable <password>'));
                _guild.configuration.password.enable = true;
                _guild.configuration.password._password = args[1];
                _guild.configuration.password.usersWithAcces = [];
                message.delete();
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: `${LANG.commands.protect['2fa'].message2}.` });
            }else{
                message.reply({ content: `${LANG.commands.protect['2fa'].message3}.` });
            }
        }else if(args[0] == 'disable') {
            if(_guild.configuration.password.enable == true) {
                _guild.configuration.password.enable = false;
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: `${LANG.commands.protect['2fa'].message4}.` });
            }else{
                message.reply({ content: `${LANG.commands.protect['2fa'].message5}.` });
            }
        }else{
            message.reply(await dataRequired('' + LANG.commands.protect['2fa'].message6 + '.\n\n' + _guild.configuration.prefix + '2fa {enable <password>, disable}'));
        }

    },
}