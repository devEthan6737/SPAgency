const Discord = require('discord.js-light');
const ms = require('ms')

module.exports = {
	nombre: 'muteinfo',
	category: 'Moderación',
    premium: false,
	alias: ['off'],
	description: 'Obtén información sobre una persona muteada o todos los usuarios muteados.',
	usage: ['<prefix>muteinfo [userMention]'],
	run: async (client, message, args, _guild) => {

        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.me.permissions.has('MANAGE_ROLES')) return message.channel.send({ content: LANG.data.permissionsRolesme });
		if(!message.member.permissions.has('KICK_MEMBERS')) return message.channel.send({ content: LANG.data.permissionsKick });
        if(!_guild.moderation.dataModeration.muterole)return message.channel.send({content: LANG.commands.mod.muteinfo.message1 + _guild.configuration.prefix + LANG.commands.mod.muteinfo.message2 });

		let userMention = message.mentions.members.first();
        if(!userMention) {
            if(_guild.moderation.dataModeration.timers.length > 20)return message.reply({ content: LANG.commands.mod.muteinfo.message3 + _guild.moderation.dataModeration.timers.length + LANG.commands.mod.muteinfo.message4, components: [
                new Discord.MessageActionRow()
                .addComponents(new Discord.MessageButton()
                    .setLabel(LANG.commands.mod.muteinfo.message5)
                    .setEmoji('🛑')
                    .setCustomId('unmuteAll')
                    .setStyle('DANGER'),
                )
            ] });
            let cc = 1;
            message.reply({ content: LANG.commands.mod.muteinfo.message3 + _guild.moderation.dataModeration.timers.length + LANG.commands.mod.muteinfo.message4, embeds: [ new Discord.MessageEmbed().setColor(0x0056ff)
                .setAuthor(LANG.commands.mod.muteinfo.message6).setDescription(`${_guild.moderation.dataModeration.timers.map(x => `\`${cc++}.\` ${x.user.username}`).join('\n')}`)
            ], components: [
                new Discord.MessageActionRow()
                    .addComponents(new Discord.MessageButton()
                        .setLabel(LANG.commands.mod.muteinfo.message5)
                        .setEmoji('🛑')
                        .setCustomId('unmuteAll')
                        .setStyle('DANGER'),
                    )
            ] });
        }else{
            if(userMention.id == client.user.id)return;
            if(userMention.id == message.author.id)return message.reply({ content: LANG.commands.mod.muteinfo.message7 });
            if(!userMention.roles.cache.has(_guild.moderation.dataModeration.muterole))return message.channel.send({ content: LANG.commands.mod.muteinfo.message8});

            let has = false;
            _guild.moderation.dataModeration.timers.forEach(x => {
                if(x.user.id == userMention.id) {
                    has = true;
                    message.reply({ embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(`${userMention.user.tag}`, `${userMention.user.displayAvatarURL()}`)
                        .setDescription(LANG.commands.mod.muteinfo.message9 + x.user.roles.length + LANG.commands.mod.muteinfo.message10 + new Date(x.endAt) + LANG.commands.mod.muteinfo.message11 + ms(x.endAt - Date.now()) + LANG.commands.mod.muteinfo.message12 + x.channel + '`')
                    ] });
                }
            });
            if(has == false)return message.channel.send({ content: LANG.commands.mod.muteinfo.message13 });
        }
	},
};