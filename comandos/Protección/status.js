const Discord = require('discord.js-light');

module.exports = {
	nombre: 'status',
	category: 'Protección',
    premium: false,
	alias: ['panel', 'st'],
	description: 'Con este comando podrás ver el estado de la configuración en tu servidor.',
	usage: ['<prefix>status [detailed, moderation]'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        let p;
        if(_guild.moderation.automoderator.enable == true) {
            p = 'Automoderador: `' + LANG.commands.protect.status.enable + '.`';
        }else{
            p = 'Automoderador: `' + LANG.commands.protect.status.disable + '.`'
        }

        if(args[0] && args[0] === 'detailed') {
            message.channel.send({ embeds: [
                new Discord.MessageEmbed().setColor(0x0056ff).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL()).setDescription(`Status Del Servidor \`${message.guild.name}\`\nPrefix: \`${_guild.configuration.prefix}\` | ${p}\n> **Miembros actuales:** ${message.guild.memberCount}\n> **Cantidad de Roles:** ${message.guild.roles.cache.size}\n> **Creado el:** ${message.guild.joinedAt.toDateString()}`)
                .addField('📣 Warn Entry:', `Estado: \`${_guild.protection.warnEntry ? 'Activado' : 'Desactivado'}\``, true)
                .addField('💻 Sistema Personalizado:', `Estado: \`${_guild.protection.ownSystem.enable ? 'Activado' : 'Desactivado'}\``, true)
                .addField('🌊 Antiflood:', `Estado: \`${_guild.protection.antiflood ? 'Activado' : 'Desactivado'}\``, true)
                .addField('🌊 Antiflood inteligente:', `Estado: \`${_guild.protection.intelligentAntiflood ? 'Activado' : 'Desactivado'}\``, true)
                .addField('🆕 bloqNewCreatedUsers:', `Tiempo: \`${_guild.protection.bloqNewCreatedUsers.time}\``, true)
                .addField('🙇‍♂️ bloqEntritiesByName:', `Estado: \`${_guild.protection.bloqEntritiesByName.enable ? 'Activado' : 'Desactivado'}\`\nBloqueados: \`${_guild.protection.bloqEntritiesByName.names.length} nombres.\``, true)
                .addField('🚨 Antiraid:', `Estado: \`${_guild.protection.antiraid.enable ? 'Activado' : 'Desactivado'}\`\nContador: \`${_guild.protection.antiraid.amount}\``, true)
                .addField('🤖 Antibots:', `Estado: \`${_guild.protection.antibots.enable ? 'Activado' : 'Desactivado'}\`\nTipo: \`${_guild.protection.antibots._type}\``, true)
                .addField('🔍 Antijoins:', `Estado: \`${_guild.protection.antijoins.enable ? 'Activado' : 'Desactivado'}\`\nRecordando: \`${_guild.protection.antijoins.rememberEntrities.length}\``, true)
                .addField('✔ Marcar Maliciosos:', `Estado: \`${_guild.protection.markMalicious.enable ? 'Activado' : 'Desactivado'}\`\nTipo: \`${_guild.protection.markMalicious._type}\``, true)
                .addField('🕑 CannotEnterTwice:', `Estado: \`${_guild.protection.cannotEnterTwice.enable ? 'Activado' : 'Desactivado'}\`\nUsuarios: \`${_guild.protection.cannotEnterTwice.users.length}\``, true)
                .addField('🆘 IntelligentSOS:', `Estado: \`${_guild.protection.intelligentSOS.enable ? 'Activado' : 'Desactivado'}\`\nEnfriamiento: \`${_guild.protection.intelligentSOS.cooldown ? 'Activado.' : 'Desactivado.'}\``, true)
                .addField('👮‍♂️ Expulsar Maliciosos:', `Estado: \`${_guild.protection.kickMalicious.enable ? 'Activado' : 'Desactivado'}\`\nRecordando: \`${_guild.protection.kickMalicious.rememberEntrities.length}\``, true)
                .addField('📏 Logs:', `Canal: \`${_guild.configuration.logs[0] ?? 'Logs desactivados.'}\`\nCanal de error: \`${_guild.configuration.logs[1] ?? 'Logs desactivados.'}\``, true)
                .addField('👥 Antitokens:', `Estado: \`${_guild.protection.antitokens.enable ? 'Activado' : 'Desactivado'}\`\nEntradas: \`${_guild.protection.antitokens.usersEntrities.length}\`\nContador: \`${_guild.protection.antitokens.entritiesCount}\``, true)
                .addField('🚧 AntiWebhooks:', `Estado: \`${_guild.protection.purgeWebhooksAttacks.enable ? 'Activado' : 'Desactivado'}\`\nContador: \`${_guild.protection.purgeWebhooksAttacks.amount}\`\nLastOwner: \`${_guild.protection.purgeWebhooksAttacks.rememberOwners ?? 'Nadie.'}\``, true)
                .addField('🔐 Raidmode:', `Estado: \`${_guild.protection.raidmode.enable ? 'Activado' : 'Desactivado'}\`\nTtd: \`${_guild.protection.raidmode.timeToDisable}\`\nContraseña: \`${_guild.protection.raidmode.password.length} caracteres\`\nDía activado: \`${_guild.protection.raidmode.activedDate}\``, true)
                .addField('🧾 Verificación:', `Estado: \`${_guild.protection.verification.enable ? 'Activado' : 'Desactivado'}\`\nTipo: \`${_guild.protection.verification._type ?? 'Tipo no establecido.'}\`\nRol: \`${_guild.protection.verification.role ?? 'Rol no establecido.'}\`\nCanal: \`${_guild.protection.verification.channel ?? 'Sin canal establecido.'}\``, true)
            ] });
        }else if(args[0] && args[0] === 'moderation') {
            message.channel.send({ embeds: [
                new Discord.MessageEmbed().setColor(0x0056ff).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL()).setDescription(`Status Del Servidor \`${message.guild.name}\`\nPrefix: \`${_guild.configuration.prefix}\` | ${p}\n> **Miembros actuales:** ${message.guild.memberCount}\n> **Cantidad de Roles:** ${message.guild.roles.cache.size}\n> **Creado el:** ${message.guild.joinedAt.toDateString()}`)
                .addField('📣 ManyPings:', `Estado: \`${_guild.moderation.dataModeration.events.manyPings ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('💻 CapitalLetters:', `Estado: \`${_guild.moderation.dataModeration.events.capitalLetters ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🚨 ManyEmojis:', `Estado: \`${_guild.moderation.dataModeration.events.manyEmojis ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🔍 ManyWords:', `Estado: \`${_guild.moderation.dataModeration.events.manyWords ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('✔ LinkDetect:', `Estado: \`${_guild.moderation.dataModeration.events.linkDetect ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('📲 Ghostping:', `Estado: \`${_guild.moderation.dataModeration.events.ghostping ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🔞 nsfwFilter:', `Estado: \`${_guild.moderation.dataModeration.events.nsfwFilter ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🔐 iploggerFilter:', `Estado: \`${_guild.moderation.dataModeration.events.iploggerFilter ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
            ] });
        }else{
            message.channel.send({ embeds: [
                new Discord.MessageEmbed().setColor(0x0056ff).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL()).setDescription(`Status Del Servidor \`${message.guild.name}\`\nPrefix: \`${_guild.configuration.prefix}\` | ${p}\n\`\`\`Este comando tiene dos funciones más:\n${_guild.configuration.prefix}status detailed\n${_guild.configuration.prefix}status moderation\`\`\``)
                .addField('📣 Warn Entry:', `Estado: \`${_guild.protection.warnEntry ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('💻 Sistema Personalizado:', `Estado: \`${_guild.protection.ownSystem.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🌊 Antiflood:', `Estado: \`${_guild.protection.antiflood ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🌊 Antiflood inteligente:', `Estado: \`${_guild.protection.intelligentAntiflood ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🆕 bloqNewCreatedUsers:', `Estado: \`${_guild.protection.bloqNewCreatedUsers.time}\``, true)
                .addField('🙇‍♂️ bloqEntritiesByName:', `Estado: \`${_guild.protection.bloqEntritiesByName.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🚨 Antiraid:', `Estado: \`${_guild.protection.antiraid.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🤖 Antibots:', `Estado: \`${_guild.protection.antibots.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🔍 Antijoins:', `Estado: \`${_guild.protection.antijoins.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('✔ Marcar Maliciosos:', `Estado: \`${_guild.protection.markMalicious.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🕑 CannotEnterTwice:', `Estado: \`${_guild.protection.cannotEnterTwice.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🆘 IntelligentSOS:', `Estado: \`${_guild.protection.intelligentSOS.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('👮‍♂️ Expulsar Maliciosos:', `Estado: \`${_guild.protection.kickMalicious.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('📏 Logs:', `Canal: \`${_guild.configuration.logs[0] ?? 'Logs desactivados.'}\``, true)
                .addField('👥 Antitokens:', `Estado: \`${_guild.protection.antitokens.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🚧 AntiWebhooks:', `Estado: \`${_guild.protection.purgeWebhooksAttacks.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🔐 Raidmode:', `Estado: \`${_guild.protection.raidmode.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
                .addField('🧾 Verificación:', `Estado: \`${_guild.protection.verification.enable ? `${LANG.commands.protect.status.enable}` : `${LANG.commands.protect.status.disable}`}\``, true)
            ] });
        }

    },
}