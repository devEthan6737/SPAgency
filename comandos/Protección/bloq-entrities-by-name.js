const Discord = require('discord.js-light');
const { dataRequired, pulk } = require('../../functions');

module.exports = {
    nombre: "bloq-entrities-by-name",
    category: "Protección",
    premium: false,
    alias: ['bloqentritiesbyname', 'bebn'],
    description: "Haz que el bot expulse usuarios con nombres que no desees.",
    usage: ['<prefix>bloqEntritiesByName {add, remove, clearAll}'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMINme}.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(!args[0])return message.reply(await dataRequired('' + LANG.commands.protect.bebn.message1 + '.\n\n' + _guild.configuration.prefix + 'bebn {add, remove, clearAll}'));

        if(args[0] == 'add') {

            if(!args[1])return message.reply(await dataRequired('' + LANG.commands.protect.bebn.message2 + '.\n\n' + _guild.configuration.prefix + 'bebn add <newBadword>'));
            _guild.protection.bloqEntritiesByName.names.push(args[1].toLowerCase());
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.bebn.message3} \`${args[1].toLowerCase()}\` ${LANG.commands.protect.bebn.message4}.` });

        }else if(args[0] == 'remove') {

            if(_guild.protection.bloqEntritiesByName.names.length == 0)return message.reply({ content: `${LANG.commands.protect.bebn.message5}.` });
            let cc = 1;
            message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`${LANG.commands.protect.bebn.message6}.\n\n${_guild.protection.bloqEntritiesByName.names.map(x => `\`${cc++}-\` ${x}`).join('\n')}`) ] }).catch(err => {});
            let collector = message.channel.createMessageCollector({ time: 15000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {
                    if(isNaN(m.content)) {
                        message.reply(`${LANG.commands.protect.bebn.message7}.`);
                        return collector.stop();
                    }
                    if(m.content > _guild.protection.bloqEntritiesByName.names) {
                        message.reply(`${LANG.commands.protect.bebn.message8}.`);
                        return collector.stop();
                    }

                    message.channel.send({ content: `${LANG.commands.protect.bebn.message9} ${m.content}, "${_guild.protection.bloqEntritiesByName.names[m.content - 1]}", ${LANG.commands.protect.bebn.message10}.` });
                    _guild.protection.bloqEntritiesByName.names = await pulk(_guild.protection.bloqEntritiesByName.names, _guild.protection.bloqEntritiesByName.names[m.content - 1]);
                    updateDataBase(client, message.guild, _guild, true);
                    collector.stop();
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: `${LANG.commands.protect.bebn.message11}.` });
            });

        }else if(args[0] == 'clearAll') {
            _guild.protection.bloqEntritiesByName.names = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.bebn.message12}.` });
        }else{
            message.reply(await dataRequired('' + LANG.commands.protect.bebn.message13 + '\n\n' + _guild.configuration.prefix + 'bebn {add, remove, clearAll}'));
        }
    },
}