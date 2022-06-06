const ms = require('ms');
const Premium = require('../../schemas/premiumSchema');
const antiRF = require('../../schemas/antiRF_Schema');
const Discord = require('discord.js-light');
const { pulk, fecthUsersDataBase, updateUsersDataBase } = require('../../functions');

module.exports = {
    nombre: "premium",
    category: "Otros",
    premium: false,
    alias: [],
    description: "Canjea u obtén información sobre tu premium.",
    usage: ['<prefix>premium'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        // Esquema de código: key:dateNow:endDate - Podrán hacer un unchecked entre miles de millones de combinaciones. 
        let user = await fecthUsersDataBase(client, message.author);
        if(args[0]) {
            let premiums = await Premium.findOne({ });
            if(premiums.codes.includes(args[0])) {
                let code = premiums.codes[premiums.codes.indexOf(args[0])].split(':')[2];
                premiums.codes = await pulk(premiums.codes, args[0]);
                premiums.save();
                if(code == 'infinite') {
                    user.premium.endAt = Infinity;
                    user.premium.isActive = true;
                    user.save();
                    return message.channel.send(`${LANG.commands.others.premium.message1} 🎉🥳`);
                }else if(user.premium.isActive == false) {
                    user.premium.endAt = parseInt(code) + Date.now();
                    user.premium.isActive = true;

                    if(!user.achievements.array.includes('Premium.')) {
                        message.channel.send({ content: `${LANG.commands.others.premium.message2}.` });
                        user.achievements.array.push('Premium.');
                        updateUsersDataBase(client, message.author, user, true);
                    }
                }else{
                    user.premium.endAt += parseInt(code);
                }
                setTimeout(() => {
                    updateUsersDataBase(client, message.author, user, true);
                }, 1000);
                message.channel.send(`${LANG.commands.others.premium.message3} \`${ms(parseInt(code))}\`! 🎉🥳`);
            }else{
                message.channel.send({ content: `${LANG.commands.others.premium.message4}.` });
            }
        }else{
            let embed = new Discord.MessageEmbed().setColor('5c4fff').setDescription(`${LANG.commands.others.premium.message9}.`).addField(`${LANG.commands.others.premium.message10}.`, `${LANG.commands.others.premium.message11}.`);
            if(Date.now() > user.premium.endAt) {
                message.channel.send({ content: `${LANG.commands.others.premium.message5}: \`${ms(Math.abs(user.premium.endAt - Date.now()))}\`\n\n${LANG.commands.others.premium.message6} \`${_guild.configuration.prefix}premium <premiumCode>\``, embeds: [ embed ] });
            }else{
                try{
                    message.channel.send({ content: `${LANG.commands.others.premium.message7}: \`${ms(user.premium.endAt - Date.now())}\`\n\n${LANG.commands.others.premium.message6} \`${_guild.configuration.prefix}premium <premiumCode>\``, embeds: [ embed ] });
                }catch(err) {
                    message.channel.send({ content: `${LANG.commands.others.premium.message8}.` });
                }
            }
        }
    }
}