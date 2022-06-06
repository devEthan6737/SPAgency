const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const Malicious = require('../../schemas/maliciousSchema');

module.exports = {
    nombre: "apelar",
    category: "Otros",
    premium: false,
    alias: [],
    description: "Si eres malicioso tendrás la oportunidad de apelar.",
    usage: ['<prefix>apelar <message>'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        let malicious = await Malicious.findOne({ userId: message.author.id });
        if(malicious && malicious.isMalicious) {
            if(malicious.isMalicious == false && malicious.record)return message.reply({ content: '<a:sp_si:805810572599099413> | `' + LANG.commands.others.apelar.message1 + ':' + malicious.record + '.`' });
            if(malicious.punishment >= Date.now())return message.reply({ content: `${LANG.commands.others.apelar.message2} ${new Date(malicious.punishment)}.` });
            if(malicious.appealStatus == 'En Espera')return message.reply({ content: `${LANG.commands.others.apelar.message3}.` });
            if(malicious.appealStatus == 'Aceptado')return message.reply({ content: `${LANG.commands.others.apelar.message4}.` });
            if(!args[0])return message.reply(await dataRequired('' + LANG.commands.others.apelar.message5 + '.\n\n' + _guild.configuration.prefix + 'apelar <message>'));
            if(args.length < 50)return message.reply(`${LANG.commands.others.apelar.message6}.`);
            let embed = new Discord.MessageEmbed()
                .setDescription(`Solicitud de apelación.\n\n**${message.author.tag}** | **${message.author.id}**`)
                .addField('Apelación:', `\`${message}\``)
                .setFooter(`Servidor: ${message.guild.name} (${message.guild.id})`);
            client.channels.cache.get('822644014436057088').send({ embeds: [ embed ], components: [
/* Estos botones no tienen código que los haga funcionar. Puedes quitarlos */                new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId(`apealAcept-${message.author.id}`).setLabel('Aceptar apelación').setStyle('PRIMARY')).addComponents(new Discord.MessageButton().setCustomId(`deniedApeal-${message.author.id}`).setLabel('Denegar apelación').setStyle('DANGER'))
            ] });
            message.reply({ content: `<@${message.author.id}> ${LANG.commands.others.apelar.message7}` });
            malicious.appealStatus = 'En Espera';
            malicious.save();
        }else{
            message.reply({ content: '<a:sp_si:805810572599099413> | `' + LANG.commands.others.apelar.message8 + '.`' });
        }
    }
}