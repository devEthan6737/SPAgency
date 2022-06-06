const Discord = require('discord.js-light');
const { dataRequired, pulk } = require("../../functions");
const Warns = require('../../schemas/warnsSchema');

module.exports = {
	nombre: 'unwarn',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Elimina un aviso de un usuario.',
	usage: ['<prefix>unwarn <userMention> [all]'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.member.permissions.has('MANAGE_MESSAGES'))return message.channel.send(`${LANG.data.permissionsMessages}.`);

        let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('' + LANG.commands.mod.unwarn.message1 + '.\n\n' + _guild.configuration.prefix + 'unwarn <userMention> [all]'));
        
        let userWarns = await Warns.findOne({ guildId: message.guild.id, userId: userMention.id });
        if(!userWarns)return message.reply({ content: `${LANG.commands.mod.unwarn.message2}.` });

        if(args[1] == 'all') {

            message.reply({ content: '' + LANG.commands.mod.unwarn.message3 + ' ' + userWarns.warns.length + ' ' + LANG.commands.mod.unwarn.message4 +'.' });
            await Warns.findOneAndDelete({ guildId: message.guild.id, userId: userMention.id });

        }else{

            let cc = 1;
            message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`${LANG.commands.mod.unwarn.message5} ${userWarns.warns.length} ${LANG.commands.mod.unwarn.message6} <@${userMention.id}>, ${LANG.commands.mod.unwarn.message7}.\n\n${userWarns.warns.map(x => `\`${cc++}-\` ${x.reason}`).join('\n')}`) ] });
            let collector = message.channel.createMessageCollector({ time: 15000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {                    
                    if(isNaN(m.content)) {
                        message.reply(`${LANG.commands.mod.unwarn.message8}.`);
                        return collector.stop();
                    }
                    if(m.content > userWarns.warns.length) {
                        message.reply(`${LANG.commands.mod.unwarn.message9}.`);
                        return collector.stop();
                    }

                    message.channel.send({ content: `${LANG.commands.mod.unwarn.message10} ${m.content} ${LANG.commands.mod.unwarn.message11} "${userWarns.warns[m.content - 1].reason}", ${LANG.commands.mod.unwarn.message12} <@${userWarns.warns[m.content - 1].moderator}> ${LANG.commands.mod.unwarn.message13}.` });
                    
                    if(userWarns.warns.length == 1) {
                        await Warns.findOneAndDelete({ guildId: message.guild.id, userId: userMention.id });
                    }else{
                        userWarns.warns = await pulk(userWarns.warns, userWarns.warns[m.content - 1]);
                        userWarns.save();
                    }
                    collector.stop();
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: `${LANG.commands.mod.unwarn.message14}.` });
            });
        }
    },
};