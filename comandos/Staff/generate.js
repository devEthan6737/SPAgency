// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const generate = ['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D', 'e', 'E', 'f', 'F', 'g', 'G', 'h', 'H', 'i', 'I', 'j', 'J', 'k', 'K', 'l', 'L', 'n', 'N', 'm', 'M', 'ñ', 'Ñ', 'o', 'O', 'p', 'P', 'q', 'Q', 'r', 'R', 's', 'S', 't', 'T', 'u', 'U', 'v', 'V', 'w', 'W', 'x', 'X', 'y', 'Y', 'z', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const ms = require('ms');
const Premium = require('../../schemas/premiumSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'generate',
	category: 'Staff',
	premium: false,
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
        if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send('Necesito permiso de __Banear Miembros__.');

        let roles = await dev.get(`${message.author.id}.roles`);
		if(!roles.includes('835944342652059668'))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Alto mando.`');
        
        if(!args[0])return message.channel.send('No has escrito la cantidad de códigos que generaré.');
		if(isNaN(args[0]))return message.channel.send('Eso no era un número.');
        if(args[1]) {
            if(isNaN(ms(args[1])))return message.channel.send('\`' + args[1] + '\` no es un número.');
            args[1] = ms(args[1]);
        }

        let codes = [];
        let premiums = await Premium.findOne({ });
        for(let x = 0; x < parseInt(args[0]); x++) {
            let a;
            if(!args[1]) {
                a = `${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}.${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}.${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}.${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}.${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}:${Date.now()}:infinite`;
            }else{
                a = `${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}.${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}.${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}.${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}.${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}${generate[Math.floor(Math.random() * generate.length)]}:${Date.now()}:${args[1]}`;
            }
            codes.push(a);
            premiums.codes.push(a);
        }
        premiums.save();

        message.channel.send({ content: '```\n' + codes.map(x=> `${x}`).join('\n') + '```' });
    },
};