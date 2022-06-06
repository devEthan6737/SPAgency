const Discord = require('discord.js-light');

module.exports = {
	nombre: 'snipe',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Mira los cinco últimos mensajes eliminados/editados de tu servidor.',
	usage: ['<prefix>snipe [snipesAmount] {edit, delete}'],
	run: async (client, message, args, _guild) => {
        try{
            let amount;
            if(!args[0]) amount = 0; if(args[0] && isNaN(parseInt(args[0]))) amount = 0; if(args[0] && !isNaN(parseInt(args[0]))) amount = parseInt(args[0] - 1);
            if(amount > 5)return message.reply({ content: 'Máximo 5 snipes a la vez.' });
            if(args[0] == 'edit' || args[1] == 'edit') {
                if(_guild.moderation.dataModeration.snipes.editeds.length < 5)return message.reply({ content: 'No hay mensajes editados en el servidor.' });
                for(x = 0; x <= amount; x++) {
                    if(x == 0) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.editeds[4].tag, _guild.moderation.dataModeration.snipes.editeds[4].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.editeds[4].content).setFooter(_guild.moderation.dataModeration.snipes.editeds[4].at) ] });
                    }else if(x == 1) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.editeds[3].tag, _guild.moderation.dataModeration.snipes.editeds[3].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.editeds[3].content).setFooter(_guild.moderation.dataModeration.snipes.editeds[3].at) ] });
                    }else if(x == 2) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.editeds[2].tag, _guild.moderation.dataModeration.snipes.editeds[2].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.editeds[2].content).setFooter(_guild.moderation.dataModeration.snipes.editeds[2].at) ] });
                    }else if(x == 3) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.editeds[1].tag, _guild.moderation.dataModeration.snipes.editeds[1].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.editeds[1].content).setFooter(_guild.moderation.dataModeration.snipes.editeds[1].at) ] });
                    }else if(x == 4) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.editeds[0].tag, _guild.moderation.dataModeration.snipes.editeds[0].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.editeds[0].content).setFooter(_guild.moderation.dataModeration.snipes.editeds[0].at) ] });
                    }
                }
            }else{
                if(_guild.moderation.dataModeration.snipes.deleteds.length < 5)return message.reply({ content: 'No hay mensajes editados en el servidor.' });
                for(x = 0; x <= amount; x++) {
                    if(x == 0) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.deleteds[4].tag, _guild.moderation.dataModeration.snipes.deleteds[4].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.deleteds[4].content).setFooter(_guild.moderation.dataModeration.snipes.deleteds[4].at) ] });
                    }else if(x == 1) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.deleteds[3].tag, _guild.moderation.dataModeration.snipes.deleteds[3].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.deleteds[3].content).setFooter(_guild.moderation.dataModeration.snipes.deleteds[3].at) ] });
                    }else if(x == 2) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.deleteds[2].tag, _guild.moderation.dataModeration.snipes.deleteds[2].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.deleteds[2].content).setFooter(_guild.moderation.dataModeration.snipes.deleteds[2].at) ] });
                    }else if(x == 3) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.deleteds[1].tag, _guild.moderation.dataModeration.snipes.deleteds[1].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.deleteds[1].content).setFooter(_guild.moderation.dataModeration.snipes.deleteds[1].at) ] });
                    }else if(x == 4) {
                        message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(_guild.moderation.dataModeration.snipes.deleteds[0].tag, _guild.moderation.dataModeration.snipes.deleteds[0].displayAvatarURL).setDescription(_guild.moderation.dataModeration.snipes.deleteds[0].content).setFooter(_guild.moderation.dataModeration.snipes.deleteds[0].at) ] });
                    }
                }
            }
        }catch(err) {}
	},
};