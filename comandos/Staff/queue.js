// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
// Este sistema no está terminado.
const Discord = require('discord.js-light');
const buttons = new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('addRecentReport').setLabel('Añadir').setStyle('PRIMARY')).addComponents(new Discord.MessageButton().setCustomId('removeRecentReport').setLabel('Quitar').setStyle('DANGER')).addComponents(new Discord.MessageButton().setCustomId('setRecentReportToLast').setLabel('Aplazar al último').setStyle('PRIMARY')).addComponents(new Discord.MessageButton().setCustomId('vsubmit').setLabel('Someter a votación').setStyle('SECONDARY'));
const Timers = require('../../schemas/timersSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'queue',
	category: 'Staff',
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        let staff = await dev.get(`${message.author.id}`);
		if(staff.roles.includes('824583225166266418')) {
            let _timers = await Timers.findOne({ });
            let _length = _timers.maliciousQueue.length;
            if(_timers.maliciousQueue.length == 0) _timers.maliciousQueue.push({
                id: '.',
                reason: '.',
                proof: '.',
            });
            if(!_timers.maliciousQueue[0].voting) _timers.maliciousQueue[0].voting = false;
            message.channel.send({ content: `Hay \`${_length}\` reportes en la lista.\n\nMás reciente:\`\`\`\n${_timers.maliciousQueue[0].id}\n${_timers.maliciousQueue[0].reason}\n${_timers.maliciousQueue[0].proof}\nSometido a votación: ${_timers.maliciousQueue[0].voting ? 'Sí.' : 'No.'}\`\`\``, components: [ buttons ] });
        }
	},
};