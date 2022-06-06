const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'antibots',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Evita entrada de bots indeseadas en tu servidor.',
	usage: ['<prefix>antibots'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(_guild.protection.antibots.enable == false) {
            _guild.protection.antibots.enable = true;

            message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`${LANG.commands.protect.antibots.message1}.`) ] });
            let collector = message.channel.createMessageCollector({ time: 30000 });
            collector.on('collect', m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {                    

                    if(m.content == '1' || m.content.toLowerCase() == 'uno') {
                        _guild.protection.antibots._type = 'all';
                        message.reply({ content: `${LANG.commands.protect.antibots.message2}.` });
                        updateDataBase(client, message.guild, _guild, true);
                        collector.stop();
                    }else if(m.content == '2' || m.content.toLowerCase() == 'dos') {
                        _guild.protection.antibots._type = 'only_nv';
                        message.reply({ content: `${LANG.commands.protect.antibots.message2}.` });
                        updateDataBase(client, message.guild, _guild, true);
                        collector.stop();
                    }else if(m.content == '3' || m.content.toLowerCase() == 'tres') {
                        _guild.protection.antibots._type = 'only_v';
                        message.reply({ content: `${LANG.commands.protect.antibots.message2}.` });
                        updateDataBase(client, message.guild, _guild, true);
                        collector.stop();
                    }else{
                        message.reply({ content: `${LANG.commands.protect.antibots.message3}.` });
                        collector.stop();
                    }
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: 'Colector detenido.' });
            });
        }else{
            _guild.protection.antibots.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antibots.message4}.` });
        }

    },
}