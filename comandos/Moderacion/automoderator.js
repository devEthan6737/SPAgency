const Discord = require('discord.js-light');
const { dataRequired, pulk, updateDataBase } = require("../../functions");
const ms = require('ms');

module.exports = {
	nombre: 'automoderator',
	category: 'Moderación',
    premium: false,
	alias: ['automoderador'],
	description: 'El bot moderará automáticamente tu servidor.',
	usage: ['<prefix>automoderator {enable, disable, label, setEvent { ... }, editActions { ... } }'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');
        if(!_guild.moderation.dataModeration.muterole)return message.channel.send(`Se debe especificar el rol de muteo con \`${_guild.configuration.prefix}setmuterole <roleMention>\``);
        if(!args[0])return message.reply(await dataRequired('Debes escribir la función del comando.\n\n' + _guild.configuration.prefix + 'automoderator {enable, disable, label, setEvent { ... }, editActions { ... } }'));

        if(args[0] == 'enable') {

            if(_guild.moderation.automoderator.enable == true)return message.reply({ content: 'El automoderador ya está activo.'});
            _guild.moderation.automoderator.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'He activado el automoderador, si aún no lo configuraste usará datos por defecto, puedes cambiarlos con la función `setEvent`.' });

        }else if(args[0] == 'disable') {

            if(_guild.moderation.automoderator.enable == false)return message.reply({ content: 'El automoderador ya está desactivado.'});
            _guild.moderation.automoderator.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'He desactivado el automoderador, la configuración quedará guardada.' });

        }else if(args[0] == 'label') {

            message.reply({ content: 'Todos los sistemas del automoderador son "complementos" a los sistemas externos, la moderación de estos sistemas se pueden activar o desactivar en todo momento. Si el sistema está desactivado el bot solo borrará mensajes.', embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`Moderador activo: \`${_guild.moderation.automoderator.enable ? 'Sí' : 'No'}\``).addField('Acciones:', `Cuando un usuario tenga \`${_guild.moderation.automoderator.actions.warns[0]}\` warns lo mutearé durante \`${_guild.moderation.automoderator.actions.muteTime[1]} (${_guild.moderation.automoderator.actions.muteTime[0]}ms)\`.\nCuando un usuario tenga \`${_guild.moderation.automoderator.actions.warns[1]}\` warns le sancionaré con un \`${_guild.moderation.automoderator.actions.action}\``).addField('Sistemas:', `badwordDetect: \`${_guild.moderation.automoderator.events.badwordDetect ? 'Activado' : 'Desactivado'}\`\nfloodDetect: \`${_guild.moderation.automoderator.events.floodDetect ? 'Activado' : 'Desactivado'}\`\nmanyPings: \`${_guild.moderation.automoderator.events.manyPings ? 'Activado' : 'Desactivado'}\`\ncapitalLetters: \`${_guild.moderation.automoderator.events.capitalLetters ? 'Activado' : 'Desactivado'}\`\nmanyEmojis: \`${_guild.moderation.automoderator.events.manyEmojis ? 'Activado' : 'Desactivado'}\`\nmanyWords: \`${_guild.moderation.automoderator.events.manyWords ? 'Activado' : 'Desactivado'}\`\nlinkDetect: \`${_guild.moderation.automoderator.events.linkDetect ? 'Activado' : 'Desactivado'}\`\nghostPing: \`${_guild.moderation.automoderator.events.ghostping ? 'Activado' : 'Desactivado'}\`\nnsfwFilter: \`${_guild.moderation.automoderator.events.nsfwFilter ? 'Activado' : 'Desactivado'}\`\niploggerFilter: \`${_guild.moderation.automoderator.events.iploggerFilter ? 'Activado' : 'Desactivado'}\``) ] });

        }else if(args[0] == 'setEvent') {

            if(!args[1])return message.reply(await dataRequired('Debes escribir la función del subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent {badwordDetect {enable, disable}, floodDetect {enable, disable}, manyPings {enable, disable}, capitalLetters {enable, disable}, manyEmojis {enable, disable}, manyWords {enable, disable}, linkDetect {enable, disable}, ghostPing {enable, disable} }'));

            if(args[1] == 'badwordDetect') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent badwordDetect {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.badwordDetect = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.badwordDetect = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent badwordDetect {enable, disable}'));
                }

            }else if(args[1] == 'floodDetect') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent floodDetect {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.floodDetect = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.floodDetect = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent floodDetect {enable, disable}'));
                }

            }else if(args[1] == 'manyPings') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent manyPings {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.manyPings = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.manyPings = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent manyPings {enable, disable}'));
                }

            }else if(args[1] == 'capitalLetters') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent capitalLetters {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.capitalLetters = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.capitalLetters = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent capitalLetters {enable, disable}'));
                }

            }else if(args[1] == 'manyEmojis') {
                
                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent manyEmojis {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.manyEmojis = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.manyEmojis = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent manyEmojis {enable, disable}'));
                }

            }else if(args[1] == 'manyWords') {
                
                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent manyWords {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.manyWords = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.manyWords = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent manyWords {enable, disable}'));
                }

            }else if(args[1] == 'linkDetect') {
                
                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent linkDetect {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.linkDetect = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.linkDetect = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent linkDetect {enable, disable}'));
                }

            }else if(args[1] == 'ghostPing') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent ghostPing {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.ghostping = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.ghostping = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent ghostPing {enable, disable}'));
                }

            }else if(args[1] == 'nsfwFilter') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent nsfwFilter {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.nsfwFilter = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.nsfwFilter = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent nsfwFilter {enable, disable}'));
                }

            }else if(args[1] == 'iploggerFilter') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator setEvent iploggerFilter {enable, disable}'));

                if(args[2] == 'enable') {
                    _guild.moderation.automoderator.events.iploggerFilter = true;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento activado con éxito.' });
                }else if(args[2] == 'disable') {
                    _guild.moderation.automoderator.events.iploggerFilter = false;
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply({ content: 'Evento desactivado con éxito.' });
                }else{
                    if(!args[2])return message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator setEvent iploggerFilter {enable, disable}'));
                }

            }else{
                if(!args[1])return message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'automoderator setEvent {badwordDetect {enable, disable}, floodDetect {enable, disable}, manyPings {enable, disable}, capitalLetters {enable, disable}, manyEmojis {enable, disable}, manyWords {enable, disable}, linkDetect {enable, disable}, ghostPing {enable, disable}, nsfwFilter {enable, disable}, iploggerFilter {enable, disable} }'));
            }

        }else if(args[0] == 'editActions') {

            if(!args[1])return message.reply(await dataRequired('Debes escribir la función del subcomando.\n\n' + _guild.configuration.prefix + 'automoderator editActions {warns, muteTime <time>, lastAction <[KICK, BAN]>, ignoreLink {add, remove, clearAll} }'));

            if(args[1] == 'warns') {

                message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`Después de este mensaje, escribe la cantidad de warns que debo agregarle a un usuario para mutearlo.`) ] });
                let collector = message.channel.createMessageCollector({ time: 30000 });
                let returnDetector;
                collector.on('collect', m => {
                    if(m.content == '')return;
                    if(returnDetector)return;        
                    if(m.author.id == message.author.id) {            
                        if(isNaN(m.content)) {
                            message.reply('Eso no era un número.');
                            return collector.stop();
                        }
                        
                        message.channel.send({ content: `Entendido, a partir de ahora sancionaré \`${m.content}\` veces antes de mutear a un usuario.` });
                        message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`Ahora escribe la cantidad de warns que debo agregarle a un usuario para banearlo/expulsarlo del servidor.`) ] });
                        returnDetector = true;

                        let _collector = message.channel.createMessageCollector({ time: 30000 });
                        _collector.on('collect', _m => {
                            if(_m.content == '')return;
                            if(_m.author.id == message.author.id) {                    
                                if(isNaN(_m.content)) {
                                    message.reply('Eso no era un número.\nLa configuración no ha sido guardada.');
                                    collector.stop();
                                    return _collector.stop();
                                }
                                if(parseInt(_m) <= parseInt(m)) {
                                    message.reply('Esa cantidad de warns no puede ser menor o igual a la anterior.\nLa configuración no ha sido guardada.');
                                    collector.stop();
                                    return _collector.stop();
                                }
                                
                                message.channel.send({ content: `Configuración terminada.\n\nA partir de ahora, después de aplicar un muteo, debo sancionar \`${_m.content - m.content}\` veces más antes de banear/expulsar a un usuario.` });
                                _guild.moderation.automoderator.actions.warns = [ parseInt(m.content), parseInt(_m.content) ];
                                updateDataBase(client, message.guild, _guild, true);
                                _collector.stop();
                                collector.stop();
                            }
                        });
                        _collector.on('end', () => {});
                    }
                });
                collector.on('end', () => {
                    message.channel.send({ content: 'Colector detenido.' });
                });

            }else if(args[1] == 'muteTime') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir el tiempo que un usuario estará muteado.\n\n' + _guild.configuration.prefix + 'automoderator editActions muteTime <time>'));
                let time = ms(args[2]);
                if(!time)return message.reply('`Error 006`: No time typed.');
                if(time < 120000) {
                    time = 120000;
                    args[2] = '2m';
                }
                message.reply({ content: `A partir de ahora el tiempo de muteo es de \`${args[2]} (${time}ms)\`` });
                _guild.moderation.automoderator.actions.muteTime = [ time, args[2] ];
                updateDataBase(client, message.guild, _guild, true);

            }else if(args[1] == 'lastAction') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir el tipo de acción que aplicaré cuando el usuario sobrepase el límite máximo de warns establecidos.\n\n' + _guild.configuration.prefix + 'automoderator editActions lastAction <[KICK, BAN]>'));
                
                if(args[2] == 'BAN') {
                    _guild.moderation.automoderator.actions.action = 'BAN';
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply('Entendido, ahora aplicaré un baneo como última sanción.');
                }else if(args[2] == 'KICK') {
                    _guild.moderation.automoderator.actions.action = 'KICK';
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply('Entendido, ahora aplicaré una expulsión como última sanción.');
                }else{
                    message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'automoderator editActions lastAction <[KICK, BAN]>'));                    
                }

            }else if(args[1] == 'ignoreLink') {

                if(!args[2])return message.reply(await dataRequired('Debes escribir la función del sub-subcomando.\n\n' + _guild.configuration.prefix + 'automoderator editActions ignoreLink {add, remove, clearAll}'));

                if(args[2] == 'add') {

                    if(!args[3])return message.reply(await dataRequired('Debes escribir el nuevo tipo de link que ingoraré (Recomendado poner solo extensiones).\n\n' + _guild.configuration.prefix + 'automoderator editActions ignoreLink add <link>'));
                    _guild.moderation.automoderator.actions.linksToIgnore.push(args[3]);
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply(`A partir de ahora ignoraré links que incluyan \`${args[3]}\``);

                }else if(args[2] == 'remove') {

                    let cc = 1;
                    message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`Estás viendo los ${_guild.moderation.automoderator.actions.linksToIgnore.length} links que estoy ignorando actualmente, después de este mensaje escribe el número adjunto al link para eliminarlo.\n\n${_guild.moderation.automoderator.actions.linksToIgnore.map(x => `\`${cc++}-\` ${x}`).join('\n')}`) ] });
                    let collector = message.channel.createMessageCollector({ time: 15000 });
                    collector.on('collect', async m => {
                        if(m.content == '')return;
                        if(m.author.id == message.author.id) {                    
                            if(isNaN(m.content)) {
                                message.reply('Eso no era un número.');
                                return collector.stop();
                            }
                            if(m.content > _guild.moderation.automoderator.actions.linksToIgnore.length) {
                                message.reply('No he encontrado un número tan alto de links.');
                                return collector.stop();
                            }
        
                            _guild.moderation.automoderator.actions.linksToIgnore = await pulk(_guild.moderation.automoderator.actions.linksToIgnore, _guild.moderation.automoderator.actions.linksToIgnore[m.content - 1])
                            updateDataBase(client, message.guild, _guild, true);

                            message.channel.send({ content: `El link número ${m.content} con el contenido "${_guild.moderation.automoderator.actions.linksToIgnore[m.content - 1]}" ha sido eliminado.` });
                            collector.stop();
                        }
                    });
                    collector.on('end', () => {
                        message.channel.send({ content: 'Colector detenido.' });
                    });

                }else if(args[2] == 'clearAll') {

                    _guild.moderation.automoderator.actions.linksToIgnore = [];
                    updateDataBase(client, message.guild, _guild, true);
                    message.reply(`Todos los links a ignorar han sido eliminados.`);

                }else{
                    message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'automoderator editActions ignoreLink {add, remove, clearAll}'));
                }

            }else{
                if(!args[1])return message.reply(await dataRequired('¡Esa función no es válida!\n\n' + _guild.configuration.prefix + 'automoderator editActions {warns, muteTime <time>, lastAction <[KICK, BAN]>, ignoreLink {add, remove, clearAll} }'));
            }

        }else{
            message.reply(await dataRequired('¡Esa función no es válida!.\n\n' + _guild.configuration.prefix + 'automoderator {enable, disable, label, setEvent { ... }, editActions { ... } }'));
        }
    },
};