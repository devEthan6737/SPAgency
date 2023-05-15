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
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        try{
            if(!message.guild.me.permissions.has('ADMINISTRATOR')) return message.reply({ content: LANG.data.permissionsADMINme });
            if(!args[0])return message.reply(await dataRequired(LANG.commands.config.guild.message1 + _guild.configuration.prefix + LANG.commands.config.guild.message2));
            
            if(args[0] == 'createInvite') {
                if(message.member.permissions.has('CREATE_INSTANT_INVITE'))return message.reply({ content: LANG.data.permissionsCreateInvite });
                let invite = await message.guild.channels.cache.filter(m => m.type == 'GUILD_TEXT').random().createInvite();
                message.reply({ content: `${invite}` });
            }else if(args[0] == 'setName') {
                if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: LANG.data.permissionsADMIN });
                if(!args[1])return message.reply(await dataRequired(LANG.commands.config.guild.message3 + _guild.configuration.prefix + LANG.commands.config.guild.message4));
                message.guild.setName(args[1]).catch(err => {});
                message.reply({ content: 'Nombre del gremio editado.' });
            }else if(args[0] == 'setIcon') {
                if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: LANG.data.permissionsADMIN });
                if(!args[1])return message.reply(await dataRequired(LANG.commands.config.guild.message5 + _guild.configuration.prefix + LANG.commands.config.guild.message6));
                message.guild.setIcon(args[1]).catch(err => {});
                message.reply({ content: LANG.commands.config.guild.message7 });
            }else if(args[0] == 'info') {
                message.reply({ embeds: [
                    new Discord.MessageEmbed().setAuthor(`${message.guild.name} (${message.guild.id})`, message.guild.iconURL()).setColor(0x0056ff).setDescription(`${LANG.commands.config.guild.message8[0]} \`${message.guild.afkChannel ?? LANG.commands.config.guild.message8[1] } (${message.guild.afkChannelId ?? LANG.commands.config.guild.message8[2]})\`\n${LANG.commands.config.guild.message8[3]} \`${message.guild.afkTimeout ?? LANG.commands.config.guild.message8[3]}\`\n${LANG.commands.config.guild.message8[4]} \`${message.guild.bans.cache.size}\`\n${LANG.commands.config.guild.message8[5]} \`${message.guild.channels.cache.size}\`\n${LANG.commands.config.guild.message8[6]} \`${message.guild.createdAt}\`\n${LANG.commands.config.guild.message8[7]} \`${message.guild.defaultMessageNotifications ?? LANG.commands.config.guild.message8[8]}\`\n${LANG.commands.config.guild.message8[9]} \`${message.guild.emojis.cache.size}\`\n${LANG.commands.config.guild.message8[10]} \`${message.guild.explicitContentFilter ?? LANG.commands.config.guild.message8[11]}\`\n${LANG.commands.config.guild.message8[12]} \`${message.guild.maximumMembers}\`\n${LANG.commands.config.guild.message8[13]} \`${message.guild.memberCount}\`\n${LANG.commands.config.guild.message8[14]} \`${message.guild.mfaLevel}\`\n${LANG.commands.config.guild.message8[15]} \`${message.guild.nsfwLevel}\`\n${LANG.commands.config.guild.message8[16]} \`${message.guild.ownerId}\`\n${LANG.commands.config.guild.message8[17]} \`${message.guild.partnered ? LANG.commands.config.guild.message8[18] : LANG.commands.config.guild.message8[19] }\`\n${LANG.commands.config.guild.message8[20]} \`${message.guild.premiumSubscriptionCount}\`\n${LANG.commands.config.guild.message8[21]} \`${message.guild.premiumTier}\`\n${LANG.commands.config.guild.message8[22]} \`${message.guild.roles.cache.size}\`\n${LANG.commands.config.guild.message8[23]} \`${message.guild.roles.highest.name ?? LANG.commands.config.guild.message8[24]}\`\n${LANG.commands.config.guild.message8[25]} \`${message.guild.rulesChannel ?? LANG.commands.config.guild.message8[26]}\`\n${LANG.commands.config.guild.message8[27]} \`${message.guild.shardId}\`\n${LANG.commands.config.guild.message8[28]} \`${message.guild.stickers.cache.size}\`\n${LANG.commands.config.guild.message8[29]} \`${message.guild.vanityURLCode ?? LANG.commands.config.guild.message8[26]} (${message.guild.vanityURLUses ?? LANG.commands.config.guild.message8[26]})\`\n${LANG.commands.config.guild.message8[30]} \`${message.guild.verificationLevel}\``).addField(LANG.commands.config.guild.message8[31], `${message.guild.description ?? LANG.commands.config.guild.message8[32]}`, true)
                ]});
            }else{
                message.reply(await dataRequired(LANG.commands.config.guild.message9 + _guild.configuration.prefix + LANG.commands.config.guild.message10));
            }
        }catch(err) {}
    }
};