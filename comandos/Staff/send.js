// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Discord = require('discord.js-light');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'send',
	category: 'Staff',
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        let roles = await dev.get(`${message.author.id}.roles`);
		if(roles.includes('835570094221426750')) {
            try{
                if(!args[0])return message.channel.send({ content: 'No has escrito la id del usuario al que le enviaré el mensaje.' });
                let user = client.users.cache.get(args[0]);
                if(!user)return message.channel.send({ content: 'No he encontrado ese usuario.' });
                let _content = message.content.split(`${args[0] }`);
                if(!_content[1])return message.channel.send({ content: 'No has escrito el contenido del mensaje.' });
                message.channel.send({ embeds: [ 'Mensaje enviado:', new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(`Mensaje de un Staff Oficial de SP Agency.`, message.author.displayAvatarURL()).setDescription(_content[1]) ] });
                user.send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(`Mensaje de un Staff Oficial de SP Agency.`, message.author.displayAvatarURL()).setDescription(_content[1]) ] });
            }
            catch(e) {
                message.channel.send({ content: '`' + e + '`' });
            }
        }else message.channel.send({ content: '<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Agente oficial.`' });
	},
};