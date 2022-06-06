const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'markmalicious',
	category: 'Protección',
    premium: false,
	alias: ['mark-malicious'],
	description: 'Con este sistema el bot cambiará el apodo de un usuario o le agregará un rol si es malicioso.',
	usage: ['<prefix>markmalicious'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.markMalicious.enable == false) {
            _guild.protection.markMalicious.enable = true;

            message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`${LANG.commands.protect.markmalicious.message1} \`${_guild.configuration.prefix}logs\`).\n\`4.\` ${LANG.commands.protect.markmalicious.message2}.`) ] });
            let collector = message.channel.createMessageCollector({ time: 30000 });
            collector.on('collect', m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {                    

                    if(m.content.includes('1') || m.content.toLowerCase().includes('uno')) {
                        if(message.author.id != message.guild.ownerId) {
                            message.reply({ content: `${LANG.commands.protect.markmalicious.message3}.` });
                            collector.stop();
                            return;
                        }

                        let roleMention = m.mentions.roles.first();
                        if(!roleMention) {
                            message.reply({ content: `${LANG.commands.protect.markmalicious.message4}` });
                            collector.stop();
                            return;
                        }
                        if(!message.guild.roles.cache.has(roleMention.id)) {
                            message.reply(`${LANG.commands.protect.markmalicious.message5}.`);
                            collector.stop();
                            return;
                        }
                        _guild.protection.markMalicious._type = `addRole:${roleMention.id}`;
                        message.reply({ content: `${LANG.commands.protect.markmalicious.message6}.` });
                        updateDataBase(client, message.guild, _guild, true);
                        collector.stop();
                    }else if(m.content == '2' || m.content.toLowerCase() == 'dos') {
                        _guild.protection.markMalicious._type = 'changeNickname';
                        message.reply({ content: `${LANG.commands.protect.markmalicious.message6}.` });
                        updateDataBase(client, message.guild, _guild, true);
                        collector.stop();
                    }else if(m.content == '3' || m.content.toLowerCase() == 'tres') {
                        if(_guild.configuration.logs.length == 0) {
                            message.reply({ content: `${LANG.commands.protect.markmalicious.message7}.` });
                            collector.stop();
                            return;
                        }
                        _guild.protection.markMalicious._type = 'sendLog';
                        message.reply({ content: `${LANG.commands.protect.markmalicious.message6}.` });
                        updateDataBase(client, message.guild, _guild, true);
                        collector.stop();
                    }else if(m.content == '4' || m.content.toLowerCase() == 'cuatro') {
                        _guild.protection.markMalicious._type = 'sendLogToOwner';
                        message.reply({ content: `${LANG.commands.protect.markmalicious.message6}.` });
                        updateDataBase(client, message.guild, _guild, true);
                        collector.stop();
                    }else{
                        message.reply({ content: `${LANG.commands.protect.markmalicious.message8}.` });
                        collector.stop();
                    }
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: `${LANG.commands.protect.markmalicious.message9}.` });
            });
        }else{
            _guild.protection.markMalicious.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.markmalicious.message10}.` });
        }

    },
}