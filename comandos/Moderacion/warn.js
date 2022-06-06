const Discord = require('discord.js-light');
const Timers = require('../../schemas/timersSchema');
const Warns = require('../../schemas/warnsSchema');
const { dataRequired, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'warn',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Agrega un aviso a un usuario.',
	usage: ['<prefix>warn <userMention> [reason]'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('MANAGE_ROLES'))return message.channel.send(`${LANG.data.permissionsRolesme}.`);
        if(!message.member.permissions.has('MANAGE_MESSAGES'))return message.channel.send(`${LANG.data.permissionsMessages}.`);

        let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('' + LANG.commands.mod.warn.message1 + '.\n\n' + _guild.configuration.prefix + 'warn <userMention> [reason]'));
        if(_guild.moderation.dataModeration.forceReasons.length > 0) {
            if(!args[1])return message.reply(await dataRequired('' + LANG.commands.mod.warn.message2 + '.\n\n' + _guild.configuration.prefix + 'warn <userMention> <reason>\n\n' + LANG.commands.mod.warn.message3 + ': ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
            if(!_guild.moderation.dataModeration.forceReasons.includes(args[1]))return message.reply(await dataRequired('' + LANG.commands.mod.warn.message4 + '.\n\n' + _guild.configuration.prefix + 'warn <userMention> <reason>\n\n' + LANG.commands.mod.warn.message3 + ': ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
        }
        if(!args[1]) args[1] = `${LANG.commands.mod.warn.message17}.`;

        let userWarns = await Warns.findOne({ guildId: message.guild.id, userId: userMention.id });
        if(userWarns) {
            userWarns.warns.push({
                reason: args.join(' ').split(`${userMention.id}> `)[1],
                moderator: message.author.id,
            });
            userWarns.save();
        }else{
            let newUser = new Warns({
                guildId: message.guild.id,
                userId: userMention.id,
                warns: [{
                    reason: args.join(' ').split(`${userMention.id}> `)[1],
                    moderator: message.author.id
                }],
                subCount: 0
            });
            userWarns = newUser;
            newUser.save();
        }

        message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`<@${userMention.id}>, ${LANG.commands.mod.warn.message5} ${userWarns.warns.length} ${LANG.commands.mod.warn.message6}: \`${args.join(' ').split(`${userMention.id}> `)[1]}\`\n${LANG.commands.mod.warn.message7}: \`${message.author.tag}\``) ] });
        if((userWarns.warns.length == _guild.moderation.automoderator.actions.warns[0] || userWarns.warns.length == _guild.moderation.automoderator.actions.warns[1]) && _guild.configuration.subData.dontRepeatTheAutomoderatorAction == true) {
            message.reply({ content: `${LANG.commands.mod.warn.message8} \`${userMention.user.username}\` ${LANG.commands.mod.warn.message9}.`, components: [
                new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('dontRepeatTheAutomoderatorAction').setLabel(`${LANG.commands.mod.warn.message10}.`).setStyle('DANGER'))
            ] });
        }

        if(_guild.moderation.automoderator.enable == true) {
            if(userWarns.warns.length == _guild.moderation.automoderator.actions.warns[0] && _guild.configuration.subData.dontRepeatTheAutomoderatorAction == false) {
                let remember = [];
                try{
                    userMention.roles.cache.forEach(x => {
                        remember.push(x.id);
                        userMention.roles.remove(x.id).catch(err => {});
                    });
                
                    userMention.roles.add(_guild.moderation.dataModeration.muterole).catch(err => {
                        message.channel.send(err);
                    });
                }catch(err) {
                    message.channel.send(err);
                }

                // Set timer:
                _guild.moderation.dataModeration.timers.push({
                    user: {
                        id: userMention.id,
                        username: userMention.user.username,
                        roles: remember
                    },
                    endAt: Date.now() + _guild.moderation.automoderator.actions.muteTime[0],
                    action: 'UNMUTE',
                    channel: message.channel.id,
                    inputTime: args[1]
                });
                updateDataBase(client, message.guild, _guild, true);
                let _timers = await Timers.findOne({ });
                if(!_timers.servers.includes(message.guild.id)) {
                    _timers.servers.push(message.guild.id);
                    _timers.save();
                }

                message.reply({ content: `${LANG.commands.mod.warn.message11} \`${userMention.user.username}\` ${LANG.commands.mod.warn.message12} \`${_guild.moderation.automoderator.actions.muteTime[1]}\`\n\n> ${LANG.commands.mod.warn.message13}.`, components: [
                    new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('dontRepeatTheAutomoderatorAction').setLabel(`${LANG.commands.mod.warn.message14}.`).setStyle('DANGER'))
                ] });
            }else if(userWarns.warns.length == _guild.moderation.automoderator.actions.warns[1] && _guild.configuration.subData.dontRepeatTheAutomoderatorAction == false) {
                userMention.ban({ reason: args.join(' ').split(`${userMention.id}> `)[1] });

                message.reply({ content: `${LANG.commands.mod.warn.message15} \`${userMention.user.username}\`\n\n> ${LANG.commands.mod.warn.message16}.`, components: [
                    new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('dontRepeatTheAutomoderatorAction').setLabel(`${LANG.commands.mod.warn.message14}.`).setStyle('DANGER'))
                ] });
            }
        }
    },
};