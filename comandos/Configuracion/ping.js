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
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        try{
            message.reply('<a:sp_loading:805810562349006918> ' + LANG.commands.config.ping.message1).then(async m => {
                let ping = m.createdTimestamp - message.createdTimestamp;
                m.edit(LANG.commands.config.ping.message2.replace('<emoji1>', ':globe_with_meridians:').replace('<msgping>', ping).replace('<emoji2>', '<a:sp_loading:805810562349006918>)').replace('<emoji3>', ':robot:').replace('<apiping>', client.ws.ping)).then(async x => {
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
                    m.edit(LANG.commands.config.ping.message3.replace('<emoji1>', ':globe_with_meridians:').replace('<msgping>', ping).replace('<emoji2>', '<a:sp_loading:805810562349006918>)').replace('<emoji3>', ':robot:').replace('<apiping>', client.ws.ping).replace('<emoji4>', '📚').replace('<dbping>', ms(timestamp)).replace('<emoji5>', '📁').replace('<cacheping>', ms(nowcache)));
                });
            });
        }catch(err) {
            console.log(err)
            message.reply(err);
        }
	},
};
