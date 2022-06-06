// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'password',
	category: 'Staff',
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        let staff = await dev.get(`${message.author.id}`);
		if(staff.roles.includes('824583225166266418')) {
            if(args[0] == 'md') {
                message.channel.send({ content: 'Mira tu privado.' });
                message.author.send({ content: 'Tu contraseña actual (Cambia cuando el bot se reinicia): `' + staff.password + '`' }).catch(err => {});
            }else{
                message.channel.send({ content: 'Tu contraseña actual (Cambia cuando el bot se reinicia): `' + staff.password + '`' });
            }
        }
	},
};