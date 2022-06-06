// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const Malicious = require('../../schemas/maliciousSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');
const ms = require('ms');

module.exports = {
	nombre: 'mi',
	category: 'Staff',
	alias: ['malicious-info'],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        let roles = await dev.get(`${message.author.id}.roles`);
		if(roles.includes('824583225166266418')) {
            if(!parseInt(args[0]))return message.reply('Ingresa una id.');
            let malicious = await Malicious.findOne({ userId: args[0] });
            if(malicious && malicious.isMalicious) {
                let embed = new Discord.MessageEmbed()
                    .setAuthor('Información De Lista Negra.')
                    .setDescription(`ID: **${args[0]}**\nRazón: \`${malicious.reason}\`\nCastigo termina en/hace: \`${ms(malicious.punishment - Date.now())}\`\nAntecedentes: \`${malicious.record ?? 'Sin antecedentes.'}\`\nEstado: \`${malicious.appealStatus}\``)
                    .setFooter(`${malicious.proof}`)
                    .setImage(malicious.proof).setColor(0x5c4fff);
                message.channel.send({ embeds: [ embed ] });
                if(malicious.record) {
                    message.channel.send({ content: `Antecedentes: \`\`\`${malicious.record}\`\`\` ` });
                }
            }
            else{
                message.channel.send('<a:sp_si:805810572599099413> | `Esa persona no está marcada como un usuario malicioso.`');
                if(malicious.record) {
                    message.channel.send({ content: `Antecedentes: \`\`\`${malicious.record}\`\`\` ` });
                }
            }
        }
	},
};