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
            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply({ content: 'Necesito permiso de __Administrador__.', ephemeral: true });
    
            let member = message.mentions.members.first();
            if(!member)return message.reply(await dataRequired('No has mencionado al miembro.\n\n' + _guild.configuration.prefix + 'member <userMention> {setnickname <newNickname>, removeRole <roleMention>, addRole <roleMention>, info}'));
            if(!args[1])return message.reply(await dataRequired('No has especificado el tipo de función.\n\n' + _guild.configuration.prefix + 'member <userMention> {setnickname <newNickname>, removeRole <roleMention>, addRole <roleMention>, info}'));
            
            if(args[1] == 'setnickname') {
                if(!message.member.permissions.has('MANAGE_NICKNAMES'))return message.reply({ content: 'Necesitas permisos de __Gestionar Apodos__.', ephemeral: true });
                if(!args[2])return message.reply(await dataRequired('No has especificado el nuevo apodo del miembro.\n\n' + _guild.configuration.prefix + 'member <userMention> setnickname <newNickname>'));
                let newNickname = args.join(' ').split('setNickname ');
                member.setNickname(newNickname[1]);
                message.reply({ content: 'He cambiado el apodo del miembro.', ephemeral: true });
            }else if(args[1] == 'removeRole') {
                if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply({ content: 'Necesitas permisos de __Gestionar Roles__.', ephemeral: true });
                let roleMention = message.mentions.roles.first();
                if(!roleMention)return message.reply(await dataRequired('No has mencionado el rol.\n\n' + _guild.configuration.prefix + 'member <userMention> removeRole <roleMention>'));
                if(roleMention.position > message.member.roles.highest.position)return message.reply({ content: 'Ese rol está por encima del tuyo, ponlo más abajo.', ephemeral: true });
                if(!member.roles.cache.has(roleMention.id))return message.reply({ content: 'El miembro no tiene ese rol.', ephemeral: true });
                member.roles.remove(roleMention.id).catch(err => {});
                message.reply({ content: 'He removido ese rol al miembro.', ephemeral: true });
            }else if(args[1] == 'addRole') {
                if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply({ content: 'Necesitas permisos de __Gestionar Roles__.', ephemeral: true });
                let roleMention = message.mentions.roles.first();
                if(!roleMention)return message.reply(await dataRequired('No has mencionado el rol.\n\n' + _guild.configuration.prefix + 'member <userMention> removeRole <roleMention>'));
                if(roleMention.position > message.member.roles.highest.position)return message.reply({ content: 'Ese rol está por encima del tuyo, ponlo más abajo.', ephemeral: true });
                if(member.roles.cache.has(roleMention.id))return message.reply({ content: 'El miembro ya tiene ese rol.', ephemeral: true });
                member.roles.add(roleMention.id).catch(err => {});
                message.reply({ content: 'He añadido ese rol al miembro.', ephemeral: true });
            }else if(args[1] == 'info') {
                let herRoles = [];
                if(member.roles.length > 0) {
                    member.roles.forEach(x => {
                        herRoles.push(x);
                    });
                }else{
                    herRoles.push('Sin roles.');
                }
                if(herRoles.length > 25) herRoles = [ 'No puedo mostrar más de 25 nombres de roles.' ];
    
                message.reply({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(member.user.tag, member.user.displayAvatarURL())
                        .setDescription(`ID & NICKNAME: \`${ member.nickname ?? 'Sin apodo.' } (${ member.user.id })\`\nEntrada en el servidor: \`${ new Date(member.joinedTimestamp) }\`\nBanderas: \`${ member.user.flags.bitfield }\`\nBot: \`${ member.user.bot ? 'Es un bot.' : 'No es un bot' }\`\nRol más alto: \`${ member.roles.highest.name }\`\nAdmin: \`${ member.permissions.has('ADMINISTRATOR') ? 'Sí.' : 'No.' }\`\nRoles: \`${ herRoles.map(x => `\`${x}\``).join(', ') }\``)
                    ]
                });
            }else{
                message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'member <userMention> {setnickname <newNickname>, removeRole <roleMention>, addRole <roleMention>, info}'));
            }
        }catch(err) {}
	},
};