const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');

module.exports = {
	nombre: 'member',
	category: 'Configuración',
    premium: false,
	alias: ['user'],
	description: 'Gestiona los miembros de tu servidor de forma más rápida.',
	usage: ['<prefix>member <userMention> {setNickname <newNickname>, removeRole <roleMention>, addRole <roleMention>, info}'],
	run: async (client, message, args, _guild) => {
        try{
            let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply(LANG.data.permissionsADMINme);

            let member = message.mentions.members.first();
            if(!member)return message.reply(await dataRequired(LANG.commands.config.member.message1 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.member.message2));
            if(!args[1])return message.reply(await dataRequired(LANG.commands.config.member.message3 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.member.message2));
            
            if(args[1] == 'setnickname') {
                if(!message.member.permissions.has('MANAGE_NICKNAMES'))return message.reply(LANG.data.permissionsMAnageNicknames);
                if(!args[2])return message.reply(await dataRequired(LANG.commands.config.member.message4 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.member.message5));
                let newNickname = args.join(' ').split('setNickname ');
                member.setNickname(newNickname[1]);
                message.reply(LANG.commands.config.member.message6);
            }else if(args[1] == 'removeRole') {
                if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply(LANG.data.permissionsManageRoles);
                let roleMention = message.mentions.roles.first();
                if(!roleMention)return message.reply(await dataRequired(LANG.commands.config.member.message7 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.member.message8));
                if(roleMention.position > message.member.roles.highest.position)return message.reply(LANG.commands.config.member.message9);
                if(!member.roles.cache.has(roleMention.id))return message.reply(LANG.commands.config.member.message10);
                member.roles.remove(roleMention.id).catch(err => {});
                message.reply(LANG.commands.config.member.message11);
            }else if(args[1] == 'addRole') {
                if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply(LANG.data.permissionsManageRoles);
                let roleMention = message.mentions.roles.first();
                if(!roleMention)return message.reply(await dataRequired(LANG.commands.config.member.message7 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.member.message8));
                if(roleMention.position > message.member.roles.highest.position)return message.reply(LANG.commands.config.member.message9);
                if(member.roles.cache.has(roleMention.id))return message.reply(LANG.commands.config.member.message12);
                member.roles.add(roleMention.id).catch(err => {});
                message.reply(LANG.commands.config.member.message13);
            }else if(args[1] == 'info') {
                let herRoles = [];
                if(member.roles.length > 0) {
                    member.roles.forEach(x => {
                        herRoles.push(x);
                    });
                }else herRoles.push(LANG.commands.config.member.message14);

                if(herRoles.length > 25) herRoles = [ LANG.commands.config.member.message15 ];
    
                message.reply({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(member.user.tag, member.user.displayAvatarURL())
                        .setDescription(`ID & NICKNAME: \`${ member.nickname ?? 'Sin apodo.' } (${ member.user.id })\`\nEntrada en el servidor: \`${ new Date(member.joinedTimestamp) }\`\nBanderas: \`${ member.user.flags.bitfield }\`\nBot: \`${ member.user.bot ? 'Es un bot.' : 'No es un bot' }\`\nRol más alto: \`${ member.roles.highest.name }\`\nAdmin: \`${ member.permissions.has('ADMINISTRATOR') ? 'Sí.' : 'No.' }\`\nRoles: \`${ herRoles.map(x => `\`${x}\``).join(', ') }\``)
                    ]
                });
            }else{
                message.reply(await dataRequired(LANG.commands.config.member.message16 + '\n\n' + _guild.configuration.prefix + LANG.commands.config.member.message2));
            }
        }catch(err) {}
	},
};