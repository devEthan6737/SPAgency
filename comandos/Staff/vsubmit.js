// Deberías cambiar todo de aquí, en el caso de que no sepas no lo toques y escribe return en la linea 14.
const Timers = require('../../schemas/timersSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');

module.exports = {
	nombre: 'vsubmit',
	category: 'Staff',
	alias: [],
	description: 'Información Privada',
	usage: ['Uso Privado'],
	run: async (client, message, args, _guild) => {
		if(!dev.has(message.author.id))return message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Ese comando no existe.`');
        let staff = await dev.get(`${message.author.id}`);
		if(staff.roles.includes('921841473312419861')) {
            if(args[0] == 'edit') {
                message.channel.send({ content: 'Después de este mensaje, escribe la id del usuario que quieres reportar.' });
                let collector = message.channel.createMessageCollector({ time: 15000 });
                collector.on('collect', async m => {
                    if(m.content == '')return;
                    if(m.author.id == message.author.id) {
                        if(isNaN(parseInt(m.content))) {
                            message.channel.send({ content: 'Eso no era un número.' });
                            collector.stop();
                            return;
                        }
                        args[0] = m.content;
                        collector.stop();
                        message.channel.send({ content: 'Ahora, escribe la razón del usuario que quieres reportar.\n\nRazones disponibles: ' + razones.map(x => `${x}`).join(', ') });
                        let _collector = message.channel.createMessageCollector({ time: 15000 });
                        _collector.on('collect', async _m => {
                            if(_m.content == '')return;
                            if(_m.author.id == message.author.id) {
                                if(!razones.includes(_m.content)) {
                                    message.channel.send({ content: 'Esa razón no está disponible.' });
                                    _collector.stop();
                                    return;
                                }
                                args[1] = _m.content;
                                _collector.stop();
                                message.channel.send({ content: 'Para terminer, escribe la prueba (Enlace) de que el usuario que quieres reportar se denomina como `' + args[1] + '`.\n\nRazones disponibles: ' + razones.map(x => `${x}`).join(', ') });
                                let __collector = message.channel.createMessageCollector({ time: 15000 });
                                __collector.on('collect', async __m => {
                                    if(__m.content == '')return;
                                    if(__m.author.id == message.author.id) {
                                        if(!__m.content.startsWith('https://')) {
                                            message.channel.send({ content: 'Eso no era un enlace válido.' });
                                            __collector.stop();
                                            return;
                                        }
                                        args[2] = __m.content;
                                        let found = false;
                                        _timers.maliciousQueue.forEach(x => {
                                            if(x.id == args[0]) {
                                                message.channel.send({ content: 'Usuario encontrado, editando...' });
                                                found = true;
                                                _timers.maliciousQueue[_timers.maliciousQueue.indexOf(x)].votting = true;
                                                _timers.save();
                                                message.channel.send({ content: 'Datos de la cola actualizados, cuando el reporte esté en el número uno de la lista será sometido a votación de forma automática.' });
                                            }
                                        });
                                        if(found == false) message.channel.send({ content: 'Usuario no encontrado en la cola.' });
                                        __collector.stop();
                                    }
                                });
                            }
                        });
                    }
                });
            }else{
                if(!parseInt(args[0]))return message.channel.send({ content: 'No has escrito la id del usuario.' });
                let _timers = await Timers.findOne({ });
                if(_timers.maliciousQueue.length == 0)return message.channel.send({ content: 'No hay reportes en cola.' });
                let found = false;
                _timers.maliciousQueue.forEach(x => {
                    if(x.id == args[0]) {
                        message.channel.send({ content: 'Usuario encontrado, sometiendo a votación...' });
                        found = true;
                        _timers.maliciousQueue[_timers.maliciousQueue.indexOf(x)].votting = true;
                        _timers.save();
                        message.channel.send({ content: 'Datos de la cola actualizados, cuando el reporte esté en el número uno de la lista será sometido a votación de forma automática.' });
                    }
                });
                if(found == false) message.channel.send({ content: 'Usuario no encontrado en la cola.' });
            }
        }else message.channel.send('<a:sp_no:805810577448239154> | `¡Lástima! Necesitas ser Supervisor.`');
	},
};