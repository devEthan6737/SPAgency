const Discord = require('discord.js-light');
const antiRF = require('../../schemas/antiRF_Schema');
const Timers = require('../../schemas/timersSchema');
const Malicious = require('../../schemas/maliciousSchema');
const { fecthUsersDataBase } = require('../../functions');
const _reporte = new Discord.MessageEmbed().setColor(0x0056ff);
const razones = [ 'Raider', 'Miembro de una squad', 'Dox', 'Bot raider', 'Spam al md', 'Flood', 'Suplantar identidad', 'Nsfw', 'Toxicidad', 'Amenaza', 'Estafa', 'Infectar usuarios', 'Multicuenta maliciosa', 'Infiltración', 'Plagio', 'Generadores uncheked', 'Uso de tools', 'Incitación a lo repulsivo', 'Violación del Tos', 'Selfbot', 'Abuso de SP Agency', 'DDos'];

module.exports = {
    nombre: "reporte",
    category: "Otros",
    premium: false,
    alias: ['reportar', 'report'],
    description: "¿Algún reporte de usuario para la agencia?",
    usage: ['<prefix>reporte <userId>, <userProof>, [reason]'],
    run: async (client, message, args, _guild) => {
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
                let malicious = await Malicious.findOne({ userId: message.author.id });
                if(malicious && malicious.isMalicious) {
                    message.channel.send({ content: 'El usuario ya es malicioso.' });
                    collector.stop();
                    return;
                }
                let _timers = await Timers.findOne({ });
                _timers.maliciousQueue.forEach(x => {
                    if(x.id == m.content) {
                        message.channel.send({ content: 'El usuario ya estaba en la cola.' });
                        collector.stop();
                        return;
                    }
                });
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
                        message.channel.send({ content: 'Para terminar, escribe la prueba (Enlace) de que el usuario que quieres reportar se denomina como `' + args[1] + '`.' });
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
                                client.channels.cache.get('782712586519969792').send({ embeds: [ _reporte.setTitle('Reporte.').setDescription('```js\n' + args[0] + '\n' + args[1] + '\n' + args[2] + '```').setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL()).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL) ] });
                                _timers.maliciousQueue.push({
                                    id: args[0],
                                    reason: args[1],
                                    proof: args[2],
                                });
                                _timers.save();
                                message.channel.send({ content: `Tu reporte ha sido añadido en la posición \`${_timers.maliciousQueue.length}\` de la cola.` });
                                __collector.stop();
                            }
                        });
                    }
                });
            }
        });

        let user = await fecthUsersDataBase(client, message.author);
        if(user && user.achievements.data.reports >= 10 && !user.achievements.array.includes('Buen ciudadano.')) {
            message.channel.send({ content: 'Acabas de obtener un logro, mira tu perfil.' });
            user.achievements.array.push('Buen ciudadano.');
            user.save();
        }
    }
}