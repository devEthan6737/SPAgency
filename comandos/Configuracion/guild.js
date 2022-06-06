const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const _bug = new Discord.MessageEmbed().setColor(0x0056ff);

module.exports = {
    nombre: "guild",
    category: "Configuración",
    premium: false,
    alias: [],
    description: "Gestiona tu servidor de forma más rápida.",
    usage: ['<prefix>guild {setIcon <url>, setName <message>, createInvite, info}'],
    run: async (client, message, args, _guild) => {
        try{
            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply({ content: 'Necesito permiso de __Administrador__.', ephemeral: true });
            if(!args[0])return message.reply(await dataRequired('No has especificado la función del comando.\n\n' + _guild.configuration.prefix + 'guild {setIcon <url>, setName <message>, createInvite, info}'));
            
            if(args[0] == 'createInvite') {
                if(message.member.permissions.has('CREATE_INSTANT_INVITE'))return message.reply({ content: 'Necesitas permisos de __Crear Invitaciónes__.', ephemeral: true });
                let invite = await message.guild.channels.cache.filter(m => m.type == 'GUILD_TEXT').random().createInvite();
                message.reply({ content: `${invite}` });
            }else if(args[0] == 'setName') {
                if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
                if(!args[1])return message.reply(await dataRequired('No has especificado el nuevo nombre del servidor.\n\n' + _guild.configuration.prefix + 'guild setName <newName>'));
                message.guild.setName(args[1]).catch(err => {});
                message.reply({ content: 'Nombre del gremio editado.', ephemeral: true });
            }else if(args[0] == 'setIcon') {
                if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
                if(!args[1])return message.reply(await dataRequired('No has especificado el nuevo icono del servidor.\n\n' + _guild.configuration.prefix + 'guild setName <newUrl>'));
                message.guild.setIcon(args[1]).catch(err => {});
                message.reply({ content: 'Icono del gremio editado.', ephemeral: true });
            }else if(args[0] == 'info') {
                message.reply({ embeds: [
                    new Discord.MessageEmbed().setAuthor(`${message.guild.name} (${message.guild.id})`, message.guild.iconURL()).setColor(0x0056ff).setDescription(`Canal AFK: \`${message.guild.afkChannel ?? 'No hay canal afk.' } (${message.guild.afkChannelId ?? 'No hay ID del canal afk.'})\`\nTiempo para establecer afk: \`${message.guild.afkTimeout ?? 'Sin tiempo establecido.'}\`\nCantidad de baneos: \`${message.guild.bans.cache.size}\`\nCantidad de canales: \`${message.guild.channels.cache.size}\`\nCreado el: \`${message.guild.createdAt}\`\nTipo de notificaciones: \`${message.guild.defaultMessageNotifications ?? 'Ninguna.'}\`\nEmojis: \`${message.guild.emojis.cache.size}\`\nFiltro de contenido explícito: \`${message.guild.explicitContentFilter ?? 'Sin filtro establecido.'}\`\nMiembros máximos: \`${message.guild.maximumMembers}\`\nMiembros: \`${message.guild.memberCount}\`\nNivel de seguridad: \`${message.guild.mfaLevel}\`\nNivel de nsfw: \`${message.guild.nsfwLevel}\`\nId del owner: \`${message.guild.ownerId}\`\nServidor partner: \`${message.guild.partnered ? 'Sí.' : 'No.' }\`\nBoosters: \`${message.guild.premiumSubscriptionCount}\`\nNivel del servidor: \`${message.guild.premiumTier}\`\nCantidad de roles: \`${message.guild.roles.cache.size}\`\nRol más alto del servidor: \`${message.guild.roles.highest.name ?? 'No hay rol más alto.'}\`\nCanal de reglas: \`${message.guild.rulesChannel ?? 'No hay.'}\`\nId del shard: \`${message.guild.shardId}\`\nStickers: \`${message.guild.stickers.cache.size}\`\nVanityCode: \`${message.guild.vanityURLCode ?? 'No hay.'} (${message.guild.vanityURLUses ?? 'No hay.'})\`\nNivel de verificación: \`${message.guild.verificationLevel}\``).addField('Descripcción del servidor:', `${message.guild.description ?? 'No hay descripción.'}`, true)
                ]});
            }else{
                message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'guild {setIcon <url>, setName <message>, createInvite, info}'));
            }
        }catch(err) {}
    }
};