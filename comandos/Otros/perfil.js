const Discord = require('discord.js-light');
const antiRF = require('../../schemas/antiRF_Schema');
const ms = require('ms');
const { fecthUsersDataBase, updateUsersDataBase } = require('../../functions');
module.exports = {
	nombre: 'perfil',
	category: 'Otros',
	premium: false,
	alias: [],
	description: 'Mira los datos de tu perfil.',
	usage: ['<prefix>perfil [json]'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        let user = await fecthUsersDataBase(client, message.author);
        if(!user)return message.channel.send({ content: '`Error 007:` Doesn\'t exist database of user.' });

        if(user && !user.achievements.array.includes('Humano.')) {
            user.achievements.array.push('Humano.');
            updateUsersDataBase(client, message.author, user, true);
        }
        if(user && user.__v > 100000 && user.achievements.data.bugs >= 2 && !user.achievements.array.includes('Rey de mensajes.')) {
            user.achievements.array.push('Rey de mensajes.');
            updateUsersDataBase(client, message.author, user, true);
        }
        if(user && user.achievements.array.length >= 15 && !user.achievements.array.includes('Mentalidad de elefante.')) {
            user.achievements.array.push('Mentalidad de elefante.');
            updateUsersDataBase(client, message.author, user, true);
        }

        if(args[0] && args[0] === 'json') {
            message.channel.send({ content: `\`\`\`js\n${user.toString()}\`\`\`` });
        }else{
            let achievements = '';
            if(user.achievements.array.length == 0) user.achievements.array = [ 'Sin logros' ];
            else {
                achievements = user.achievements.array[0];
                if(user.achievements.array.length > 1) {
                    user.achievements.array.shift();
                    for(let x of user.achievements.array) {
                        if(x == user.achievements.array[user.achievements.array.length]) user.achievements.array[user.achievements.array.indexOf(x)] = x.toLowerCase().split('.').join('');
                        else user.achievements.array[user.achievements.array.indexOf(x)] = x.toLowerCase().split('.').join(', ');
                    }

                    achievements += ', ' + user.achievements.array.join('');
                }

                if(achievements.endsWith(', ')) achievements = achievements.slice(0, achievements.length - 2);
                achievements += '.';
                
            }; 
            try{
                if(user.premium.endAt == 0) user.premium.endAt = Date.now() - 1000;
                message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff)
                    .setDescription('' + LANG.commands.others.perfil.message1 +': `' + achievements + '`')
                    .addField('' + LANG.commands.others.perfil.message2 + ':', `${user.premium.isActive? '`Sí.`': '`No.`'}`, true)
                    .addField('' + LANG.commands.others.perfil.message3 + ':', `\`${ms(Math.abs(user.premium.endAt - Date.now()))}\``, true)
                ] });
            }catch(err) {
                if(user.achievements.array.length == 0) user.achievements.array = [ 'Sin logros.' ];
                message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff)
                    .setDescription('' + LANG.commands.others.perfil.message1 + ': `' + achievements + '`')
                    .addField('' + LANG.commands.others.perfil.message2 + ':', `${user.premium.isActive? '`Sí.`': '`No.`'}`, true)
                    .addField('' + LANG.commands.others.perfil.message3 + ':', `\`Nunca :o\``, true)
                ] });
            }
        }
	},
};