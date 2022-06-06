const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');
const { dataRequired } = require('../../functions');

module.exports = {
    nombre: "staff",
    category: "Otros",
    premium: false,
    alias: [],
    description: "Obtén información sobre si un usuario es staff de SP Agency.",
    usage: ['<prefix>staff <userMention>'],
    run: async (client, message, args, _guild) => {
        let img = message.mentions.users.first();
        if(!img)return message.reply(await dataRequired('¡Necesitas mencionar a un usuario!\n\n' + _guild.configuration.prefix + 'staff <userMention>'));
        if(!dev.has(img.id))return message.channel.send({ content: 'El usuario no está registrado en la membresía de SP Agency.' });
        let roles = await dev.get(`${img.id}.roles`);

        try{
            if(roles.includes('824583706257129483')) {
                return message.channel.send({ content: 'El usuario es un Director en SP Agency.' });
            }else if(roles.includes('840665167149662258')) {
                return message.channel.send({ content: 'El usuario es un Co-Director en SP Agency.' });
            }if(roles.includes('835944342652059668')) {
                return message.channel.send({ content: 'El usuario es un Alto Mando en SP Agency.' });
            }if(roles.includes('921841473312419861')) {
                return message.channel.send({ content: 'El usuario es un Supervisor en SP Agency.' });
            }if(roles.includes('835570094221426750')) {
                return message.channel.send({ content: 'El usuario es un Agente Oficial en SP Agency.' });
            }if(roles.includes('824583225166266418')) {
                return message.channel.send({ content: 'El usuario es un Recluta en SP Agency.' });
            }
        }catch(error) {}

    }
}