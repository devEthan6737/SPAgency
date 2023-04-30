const Discord = require('discord.js-light');

module.exports = {
	nombre: 'snipe',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Mira los cinco últimos mensajes eliminados/editados de tu servidor.',
	usage: ['<prefix>snipe [snipesAmount] {edit, delete}'],
	run: async (client, message, args, _guild) => {
        if(!client.super.cache.has(message.guild.id)) client.super.cache.setGuildBase(message.guild.id);
        let cache = client.super.cache.get(message.guild.id);

        try{
            let amount;
            if(!args[0]) amount = 0; if(args[0] && isNaN(parseInt(args[0]))) amount = 0; if(args[0] && !isNaN(parseInt(args[0]))) amount = parseInt(args[0] - 1);
            if(amount > 5)return message.reply({ content: 'Máximo 5 snipes a la vez.' });
            if(amount < 0)return message.relpy({ content: 'Mínimo 1 snipe.' });
            if(args[0] == 'edit' || args[1] == 'edit') {
                console.log(cache.snipes.editeds)
                if(cache.snipes.editeds.length != 5)return message.reply({ content: 'Mi memoria debe tener 5 snipes (Mensajes editados) para evitar problemas con la base del sistema de caché.' });

                if(amount == 0) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[4].tag, cache.snipes.editeds[4].displayAvatarURL).setDescription(cache.snipes.editeds[4].content).setFooter(cache.snipes.editeds[4].at).setImage(cache.snipes.editeds[4].attachments.firstAttachment)
                    ]
                });
                
                else if(amount == 1) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[4].tag, cache.snipes.editeds[4].displayAvatarURL).setDescription(cache.snipes.editeds[4].content).setFooter(cache.snipes.editeds[4].at).setImage(cache.snipes.editeds[4].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[3].tag, cache.snipes.editeds[3].displayAvatarURL).setDescription(cache.snipes.editeds[3].content).setFooter(cache.snipes.editeds[3].at).setImage(cache.snipes.editeds[3].attachments.firstAttachment)
                    ]
                });

                else if(amount == 2) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[4].tag, cache.snipes.editeds[4].displayAvatarURL).setDescription(cache.snipes.editeds[4].content).setFooter(cache.snipes.editeds[4].at).setImage(cache.snipes.editeds[4].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[3].tag, cache.snipes.editeds[3].displayAvatarURL).setDescription(cache.snipes.editeds[3].content).setFooter(cache.snipes.editeds[3].at).setImage(cache.snipes.editeds[3].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[2].tag, cache.snipes.editeds[2].displayAvatarURL).setDescription(cache.snipes.editeds[2].content).setFooter(cache.snipes.editeds[2].at).setImage(cache.snipes.editeds[2].attachments.firstAttachment)
                    ]
                });

                else if(amount == 3) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[4].tag, cache.snipes.editeds[4].displayAvatarURL).setDescription(cache.snipes.editeds[4].content).setFooter(cache.snipes.editeds[4].at).setImage(cache.snipes.editeds[4].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[3].tag, cache.snipes.editeds[3].displayAvatarURL).setDescription(cache.snipes.editeds[3].content).setFooter(cache.snipes.editeds[3].at).setImage(cache.snipes.editeds[3].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[2].tag, cache.snipes.editeds[2].displayAvatarURL).setDescription(cache.snipes.editeds[2].content).setFooter(cache.snipes.editeds[2].at).setImage(cache.snipes.editeds[2].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[1].tag, cache.snipes.editeds[1].displayAvatarURL).setDescription(cache.snipes.editeds[1].content).setFooter(cache.snipes.editeds[1].at).setImage(cache.snipes.editeds[1].attachments.firstAttachment)
                    ]
                });

                else if(amount == 4) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[4].tag, cache.snipes.editeds[4].displayAvatarURL).setDescription(cache.snipes.editeds[4].content).setFooter(cache.snipes.editeds[4].at).setImage(cache.snipes.editeds[4].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[3].tag, cache.snipes.editeds[3].displayAvatarURL).setDescription(cache.snipes.editeds[3].content).setFooter(cache.snipes.editeds[3].at).setImage(cache.snipes.editeds[3].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[2].tag, cache.snipes.editeds[2].displayAvatarURL).setDescription(cache.snipes.editeds[2].content).setFooter(cache.snipes.editeds[2].at).setImage(cache.snipes.editeds[2].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[1].tag, cache.snipes.editeds[1].displayAvatarURL).setDescription(cache.snipes.editeds[1].content).setFooter(cache.snipes.editeds[1].at).setImage(cache.snipes.editeds[1].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.editeds[0].tag, cache.snipes.editeds[0].displayAvatarURL).setDescription(cache.snipes.editeds[0].content).setFooter(cache.snipes.editeds[0].at).setImage(cache.snipes.editeds[0].attachments.firstAttachment)
                    ]
                });
            }else{
                if(cache.snipes.deleteds.length != 5)return message.reply({ content: 'Mi memoria debe tener 5 snipes (Mensajes eliminados) para evitar problemas con la base del sistema de caché.' });

                if(amount == 0) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[4].tag, cache.snipes.deleteds[4].displayAvatarURL).setDescription(cache.snipes.deleteds[4].content).setFooter(cache.snipes.deleteds[4].at).setImage(cache.snipes.deleteds[4].attachments.firstAttachment)
                    ]
                });
                
                else if(amount == 1) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[4].tag, cache.snipes.deleteds[4].displayAvatarURL).setDescription(cache.snipes.deleteds[4].content).setFooter(cache.snipes.deleteds[4].at).setImage(cache.snipes.deleteds[4].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[3].tag, cache.snipes.deleteds[3].displayAvatarURL).setDescription(cache.snipes.deleteds[3].content).setFooter(cache.snipes.deleteds[3].at).setImage(cache.snipes.deleteds[3].attachments.firstAttachment)
                    ]
                });

                else if(amount == 2) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[4].tag, cache.snipes.deleteds[4].displayAvatarURL).setDescription(cache.snipes.deleteds[4].content).setFooter(cache.snipes.deleteds[4].at).setImage(cache.snipes.deleteds[4].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[3].tag, cache.snipes.deleteds[3].displayAvatarURL).setDescription(cache.snipes.deleteds[3].content).setFooter(cache.snipes.deleteds[3].at).setImage(cache.snipes.deleteds[3].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[2].tag, cache.snipes.deleteds[2].displayAvatarURL).setDescription(cache.snipes.deleteds[2].content).setFooter(cache.snipes.deleteds[2].at).setImage(cache.snipes.deleteds[2].attachments.firstAttachment)
                    ]
                });

                else if(amount == 3) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[4].tag, cache.snipes.deleteds[4].displayAvatarURL).setDescription(cache.snipes.deleteds[4].content).setFooter(cache.snipes.deleteds[4].at).setImage(cache.snipes.deleteds[4].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[3].tag, cache.snipes.deleteds[3].displayAvatarURL).setDescription(cache.snipes.deleteds[3].content).setFooter(cache.snipes.deleteds[3].at).setImage(cache.snipes.deleteds[3].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[2].tag, cache.snipes.deleteds[2].displayAvatarURL).setDescription(cache.snipes.deleteds[2].content).setFooter(cache.snipes.deleteds[2].at).setImage(cache.snipes.deleteds[2].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[1].tag, cache.snipes.deleteds[1].displayAvatarURL).setDescription(cache.snipes.deleteds[1].content).setFooter(cache.snipes.deleteds[1].at).setImage(cache.snipes.deleteds[1].attachments.firstAttachment)
                    ]
                });

                else if(amount == 4) message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[4].tag, cache.snipes.deleteds[4].displayAvatarURL).setDescription(cache.snipes.deleteds[4].content).setFooter(cache.snipes.deleteds[4].at).setImage(cache.snipes.deleteds[4].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[3].tag, cache.snipes.deleteds[3].displayAvatarURL).setDescription(cache.snipes.deleteds[3].content).setFooter(cache.snipes.deleteds[3].at).setImage(cache.snipes.deleteds[3].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[2].tag, cache.snipes.deleteds[2].displayAvatarURL).setDescription(cache.snipes.deleteds[2].content).setFooter(cache.snipes.deleteds[2].at).setImage(cache.snipes.deleteds[2].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[1].tag, cache.snipes.deleteds[1].displayAvatarURL).setDescription(cache.snipes.deleteds[1].content).setFooter(cache.snipes.deleteds[1].at).setImage(cache.snipes.deleteds[1].attachments.firstAttachment),
                        new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(cache.snipes.deleteds[0].tag, cache.snipes.deleteds[0].displayAvatarURL).setDescription(cache.snipes.deleteds[0].content).setFooter(cache.snipes.deleteds[0].at).setImage(cache.snipes.deleteds[0].attachments.firstAttachment)
                    ]
                });
            }
        }catch(err) {}
	},
};