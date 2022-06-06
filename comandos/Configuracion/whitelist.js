const Discord = require('discord.js-light');
const { dataRequired, updateDataBase } = require("../../functions");
const db = require('megadb');
const dataRow = new db.crearDB('dataRows', 'data_bot');

module.exports = {
	nombre: 'whitelist',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Haz que SP Agency ignore algún bot verificado en el servidor.',
	usage: ['<prefix>whitelist {add <verifiedBotMention>, remove, clearAll}'],
    run: async (client, message, args, _guild) => {
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });

        let row = []; // Row del comando "remove", se declara aquí para evitar errores.
        message.guild.members.fetch();
        if(args[0] == 'add') {
            let botID = message.mentions.users.first();
            if(!botID)return message.reply(await dataRequired('¡Necesitas mencionar a un usuario!\n\n' + _guild.configuration.prefix + 'whitelist <verifiedBotMention>'));
            if(botID.flags.has(65536)) {
                if(_guild.configuration.whitelist.length >= 20)return message.reply({ content: 'No puedes agregar más de 20 bots en la lista blanca.', ephemeral: true });
                if(_guild.configuration.whitelist.includes(botID.id))return message.reply({ content: 'Ese bot ya está agregado.', ephemeral: true });
                _guild.configuration.whitelist.push(botID.id);
                updateDataBase(client, message.guild, _guild, true);
                message.reply({ content: '`' + botID.tag + '` añadido a la lista blanca.', ephemeral: true });
            }else{
                message.reply({ content: 'El miembro debe ser un bot verificado.', ephemeral: true });
            }
        }else if(args[0] == 'remove') {
            if(_guild.configuration.whitelist.length < 1)return message.reply({ content: 'No hay bots añadidos en la lista blanca.', ephemeral: true });
            try{
                message.reply('<a:sp_loading:805810562349006918> Generando row...').then(x => {
                    setTimeout(async () => {
                        _guild.configuration.whitelist.forEach(async x => {
                            let dataBot = await client.users.cache.get(x);
                            if(dataBot) {
                                row.push({
                                    label: `${dataBot.username}`,
                                    description: 'Un bot amigable.',
                                    value: `whitelist_${x}`
                                });
                            }
                        });
                        setTimeout(async () => {
                            dataRow.set(message.author.id, row);
                            await x.edit({ content: 'Seleccione el bot que desea eliminar de la lista blanca.', components: [ new Discord.MessageActionRow().addComponents(new Discord.MessageSelectMenu().setCustomId('whitelist_row').setPlaceholder('Nada seleccionado.').addOptions([row])) ], ephemeral: true });
                        }, 2000);
                    }, 2000);
                });
            }catch(err) {}
        }else if(args[0] == 'clearAll') {
            _guild.configuration.whitelist = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Lista blanca limpiada.', ephemeral: true });
        }else{
            message.reply(await dataRequired(`No se ha escrito la función del comando.\n\n${_guild.configuration.prefix}whitelist {add, remove, clearAll}`));
        }
	},
};