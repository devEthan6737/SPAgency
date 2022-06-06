const Guilds = require('../../schemas/guildsSchema');
const ms = require('ms');

module.exports = {
	nombre: 'ping',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Muestra la latencia del bot.',
	usage: ['<prefix>ping'],
	run: async (client, message, args, _guild) => {
        try{
            message.reply({ content: '<a:sp_loading:805810562349006918> Pingeando...' }).then(async m => {
                let ping = m.createdTimestamp - message.createdTimestamp;
                m.edit({ content: `:globe_with_meridians: Mensajes/ms: ${ping} (<a:sp_loading:805810562349006918>)\n:robot: Websocket/Discord Api: ${client.ws.ping}` }).then(async x => {
                    let timestamp = new Date().getMilliseconds();
                    Guilds.findOne({ id: message.guild.id }).then(() => {
                        let now = new Date().getMilliseconds();
                        timestamp = now - timestamp;
                    });
                    ping = ping - timestamp;
                    if(ping < 0) ping = ping + timestamp;
                    let nowcache = Date.now();
                    await client.database.guilds.get(message.guild.id, true);
                    nowcache = nowcache - Date.now();
                    m.edit({ content: `:globe_with_meridians: Mensajes: ${ms(ping)}\n:robot: Discord Api: ${ms(client.ws.ping)}\n📚 Database: ${ms(timestamp)}\n📁 Caché: ${ms(nowcache)}` });
                });
            });
        }catch(err) {
            message.reply(err);
        }
	},
};