const { dataRequired } = require("../../functions");
const clear = new Map();

module.exports = {
	nombre: 'clear',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Borra los mensajes de un canal de forma rápida.',
	usage: ['<prefix>clear <messagesAmount>'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('MANAGE_MESSAGES'))return message.reply('Necesito permisos de __Gestionar mensajes__.');
        if(!message.member.permissions.has('MANAGE_MESSAGES'))return message.reply('Necesitas permisos de __Gestionar mensajes__.');
        if(!args[0])return message.reply(await dataRequired('Debes escribir la cantidad de mensajes que deseas borrar.\n\n' + _guild.configuration.prefix + 'clear <messagesAmount>'));
        if(isNaN(parseInt(args[0])))return message.reply('Eso no es un número.');
        if(parseInt(args[0]) < 0) args[0] = parseInt(args[0]) - parseInt(args[0]) - parseInt(args[0]);

        try{
            if(parseInt(args[0]) > 100) {
                message.reply({ content: `Borrando \`${args[0]}\` mensajes.` });
                if(clear.has(message.guild.id))return message.reply({ content: `Aún estoy borrando \`${await clear.get(message.guild.id)}\` mensajes.` });
                clear.set(message.guild.id, parseInt(args[0]));
                function c(amount) {
                    setTimeout(() => {
                        if(amount > 100) {
                            message.channel.bulkDelete(100);
                            let newAmount = amount - 100;
                            c(newAmount);
                            clear.set(message.guild.id, newAmount);                   
                        }else{
                            clear.delete(message.guild.id);
                            message.channel.bulkDelete(amount);
                        }
                    }, 2000);
                }
                c(parseInt(args[0]));
            }else{
                message.channel.bulkDelete(parseInt(args[0]));
                message.reply({ content: `\`${args[0]}\` mensajes borrados.` });
            }
        }catch(err) {}
    },
};