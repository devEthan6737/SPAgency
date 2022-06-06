const Discord = require('discord.js-light');
const { fecthUsersDataBase } = require('../../functions');
const moreDetails = new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('moreDetails').setLabel('Más detalles').setStyle('PRIMARY'));
const lessDetails = new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('lessDetails').setLabel('Menos detalles').setStyle('PRIMARY'));
const chooseOption = new Discord.MessageActionRow().addComponents(new Discord.MessageSelectMenu().setCustomId('chooseOption').setPlaceholder('Seleccionar detalles forzados.').addOptions([
    {
        label: 'Solo más detalles.',
        description: 'El bot mostrará más detalles sin dar a elegir.',
        value: 'moreDetails',
    },
    {
        label: 'Solo menos detalles.',
        description: 'El bot mostrará menos detalles sin dar a elegir.',
        value: 'lessDetails',
    },
    {
        label: 'Más y menos detalles.',
        description: 'El bot dará a elegir entre más y menos detalles.',
        value: 'twoOptions',
    }
]));

function editMessage(buttonType, i, _embed1, _embed2) {
    if(buttonType == 'moreDetails') {
        i.edit({ embeds: [ _embed2 ], components: [ lessDetails ] });
    }else{
        i.edit({ embeds: [ _embed1 ], components: [ moreDetails ] });
    }
}

module.exports = {
    nombre: "comandos",
    category: "Otros",
    premium: false,
    alias: ['cmds', 'commands'],
    description: "Obtén todos los comandos del bot.",
    usage: ['<prefix>comandos'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);
        let user = await fecthUsersDataBase(client, message.author, false);
        if(!user)return message.reply('Err: Your document on database is not defined.');

        let embed1 = new Discord.MessageEmbed().setColor(user.premium.isActive? 0xffe76c : 0x0056ff).setDescription('' + LANG.commands.others.comandos.message1 +' `' + _guild.configuration.prefix + 'biblioteca`, ' + LANG.commands.others.comandos.message2 +' `' + _guild.configuration.prefix + 'invite`.\n' + LANG.commands.others.comandos.message3 +' (`[2]`) ' + LANG.commands.others.comandos.message4 +'.')
        .addField(`${user.premium.isActive? '<:proteccion_premium:880843689369423912>' : '<:proteccion:780163156902543370>'} | Protección:`, '`antiraid`, `antibots`, `antitokens`, `antijoins`, `mark-malicious`, `warn-entry`, `kick-malicious`, `ownsystem`, `verification`, `cannot-enter-twice`, `intelligentsos`, `purge-webhooks-attacks`, `intelligentAntiflood`, `antiflood`, `2fa [2]`, `raidmode`, `bloqEntritiesByName`, `bloqNewCreatedUsers`, `status`, `autoconfig`')
        .addField(`${user.premium.isActive? '<:mod_premium:880843615809716245>' : '<:mod:780163163421278228>'} | Moderación:`, '`warn`, `unwarn`, `warnlist`, `forcereason [3]`, `kick`, `globalkick`, `ban`, `unban`, `globalban`, `hackban`, `tempban`, `baninfo`, `mute`, `unmute`, `muteinfo`, `timeout`, `untimeout`, `forceban`, `detect`, `clear`, `nuke`, `snipe`, `support [3]`, `badword [3]`, `manyPings`, `manyEmojis`, `manyWords`, `capitalLetters`, `linkDetect`, `ghostping`, `automoderator`, `backup [5]`, `message`, `lock`, `unlock`, `nsfwFilter`, `predict`, `iploggerFilter`')
        .addField(`${user.premium.isActive? '<:config_premium:880843546536579093>' : '<:config:780163162993328138>'} | Configuración`, '`setprefix`, `ignoreThisChannel`, `setmuterole`, `unnuke [4]`, `ping`, `whitelist [3]`, `logs [2]`, `guild [4]`, `member [4]`, `channel [2]`, `verify`, `editPingReply`')
        .addField(`${user.premium.isActive? '<:otros_premium:880843655064191096>' : '<:otros:780163159553605653>'} | Otros`, '`comandos`, `biblioteca`, `me`, `staff`, `apelar`, `ayuda`, `invite`, `queja`, `reporte`, `sugerencia`, `bug`, `perfil`, `rz`')
        .setImage(user.premium.isActive? 'https://cdn.discordapp.com/attachments/814538439243333632/880546149335957504/ethansita.png' : 'https://cdn.discordapp.com/attachments/779807899492417538/779820352817332264/unknown.png')
        let embed2 = new Discord.MessageEmbed().setColor(0x0056ff).setDescription('' + LANG.commands.others.comandos.message1 +' `' + _guild.configuration.prefix + 'biblioteca`, ' + LANG.commands.others.comandos.message2 +' `' + _guild.configuration.prefix + 'invite`.\n' + LANG.commands.others.comandos.message3 +' (`[2]`) ' + LANG.commands.others.comandos.message4 +'.')
        .addField(`${user.premium.isActive? '<:proteccion_premium:880843689369423912>' : '<:proteccion:780163156902543370>'} | Protección:`, '`antiraid`, `antibots`, `antitokens`, `antijoins`, `mark-malicious`, `warn-entry`, `kick-malicious`, `ownsystem`, `verification`, `cannot-enter-twice`, `intelligentsos`, `purge-webhooks-attacks`, `intelligentAntiflood`, `antiflood`, `2fa [enable, disable]`, `raidmode`, `bloqEntritiesByName`, `bloqNewCreatedUsers`, `status`, `autoconfig`')
        .addField(`${user.premium.isActive? '<:mod_premium:880843615809716245>' : '<:mod:780163163421278228>'} | Moderación:`, '`warn`, `unwarn`, `warnlist`, `forcereason [add, remove, clearAll]`, `kick`, `globalkick`, `ban`, `unban`, `globalban`, `hackban`, `tempban`, `baninfo`, `mute`, `unmute`, `muteinfo`, `timeout`, `untimeout`, `forceban`, `detect`, `clear`, `nuke`, `snipe`, `support [sos, contact, server]`, `badword [add, remove, clearAll]`, `manyPings`, `manyEmojis`, `manyWords`, `capitalLetters`, `linkDetect`, `ghostping`, `automoderator`, `backup [create, delete, update, load, info]`, `message`, `lock`, `unlock`, `nsfwFilter`, `predict`, `iploggerFilter`')
        .addField(`${user.premium.isActive? '<:config_premium:880843546536579093>' : '<:config:780163162993328138>'} | Configuración`, '`setprefix`, `ignoreThisChannel`, `setmuterole`, `unnuke [channels, roles, emojis, bans]`, `ping`, `whitelist [add, remove, clearAll]`, `logs [enable, disable]`, `guild [createInvite, setName, setIcon, info]`, `member [setnickname, removeRole, addRole, info]`, `channel [create, delete]`, `verify`, `editPingReply`')
        .addField(`${user.premium.isActive? '<:otros_premium:880843655064191096>' : '<:otros:780163159553605653>'} | Otros`, '`comandos`, `biblioteca`, `me`, `staff`, `apelar`, `ayuda`, `invite`, `queja`, `reporte`, `sugerencia`, `bug`, `perfil`, `rz`')
        .setImage(user.premium.isActive? 'https://cdn.discordapp.com/attachments/814538439243333632/880546149335957504/ethansita.png' : 'https://cdn.discordapp.com/attachments/779807899492417538/779820352817332264/unknown.png')

        // Hice esto en v12, strange but functions.
        if(_guild.configuration.subData.showDetailsInCmdsCommand == 'twoOptions') {
            if(message.author.id == message.guild.ownerId) {
                message.channel.send({ embeds: [ embed1 ], components: [ moreDetails, chooseOption ] }).then(x => {

                    try{
                        client.on('interactionCreate', interaction => {
                            if(interaction.isButton()) {
                                if(interaction.customId == 'moreDetails' || interaction.customId == 'lessDetails') {
                                    editMessage(interaction.customId, x, embed1, embed2);
                                    interaction.reply({ content: '¡Detalles editados!', ephemeral: true });
                                }
                            }
                        });
                    }catch(err) {
                        message.channel.send({ content: 'Wow, wow, ¡Sucedió un error! Va siendo hora de eliminar el panel de comandos, ¿No?', ephemeral: true });
                        x.delete();
                    }
                }).catch(err => {
                    message.channel.send({ content: '`Error 002`: Unknown interaction' });
                });
            }else{
                message.channel.send({ embeds: [ embed1 ], components: [ moreDetails ] }).then(x => {
                    
                    try{
                        client.on('interactionCreate', interaction => {
                            if(interaction.isButton()) {
                                if(interaction.customId == 'moreDetails' || interaction.customId == 'lessDetails') {
                                    editMessage(interaction.customId, x, embed1, embed2);
                                    interaction.reply({ content: '¡Detalles editados!', ephemeral: true });
                                }
                            }
                        });
                    }catch(err) {
                        message.channel.send({ content: 'Wow, wow, ¡Sucedió un error! Va siendo hora de eliminar el panel de comandos, ¿No?', ephemeral: true });
                        x.delete();
                    }
                }).catch(err => {
                    message.channel.send({ content: '`Error 002`: Unknown interaction' });
                });
            }
        }else if(_guild.configuration.subData.showDetailsInCmdsCommand == 'moreDetails') {
            if(message.author.id == message.guild.ownerId) {
                message.channel.send({ embeds: [ embed2 ], components: [ chooseOption ] });
            }else{
                message.channel.send({ embeds: [ embed2 ] });
            }
        }else if(_guild.configuration.subData.showDetailsInCmdsCommand == 'lessDetails') {
            if(message.author.id == message.guild.ownerId) {
                message.channel.send({ embeds: [ embed1 ], components: [ chooseOption ] });
            }else{
                message.channel.send({ embeds: [ embed1 ] });
            }
        }
    }
}