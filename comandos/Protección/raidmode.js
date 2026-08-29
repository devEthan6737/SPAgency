const Discord = require('discord.js-light');
const ms = require('ms');
const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
    nombre: "raidmode",
    category: "Protección",
    premium: false,
    alias: ['rm'],
    description: "¿Te amanzan con raidear tu servidor? Con este sistema nadie podrá tocarte.",
    usage: ['<prefix>raidmode [time]'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(message.author.id != message.guild.ownerId)return message.reply({ content: 'Necesitas ser __El propietario De Este Servidor__.' });

        if(_guild.protection.raidmode.enable == false) {
            try{
                let password = `${Math.floor(Math.random() * 9999999999)}`;
                message.author.send({ content: 'Contraseña para desactivar el sistema raidmode: `' + password + '`' }).then(x => x.pin()).catch(err => {
                    return message.reply({ content: 'Primero abre tu privado.' });
                });
                
                if(!args[0]) {
                    args[0] = '30d';
                    message.reply(await dataRequired('Es posible ingresar un tiempo para que el sistema se desactive, por defecto: 30d.\n\n' + _guild.configuration.prefix + 'raidmode [time]'));
                }
                
                let time = ms(args[0]);
                if(time < ms('30d')) {
                    time = ms('30d');
                    args[0] = '30d';
                }
                
                _guild.protection.raidmode.timeToDisable = ms(time);
                _guild.protection.raidmode.enable = true;
                _guild.protection.raidmode.password = password;
                _guild.protection.raidmode.activedDate = Date.now();

                /* Other systems */
                _guild.protection.antiraid.enable = true;                       // Antiraid
                _guild.protection.antibots.enable = true;                      // Antibots
                _guild.protection.antibots._type = 'all';                     // Antibots
                _guild.protection.intelligentAntiflood = true;               // IntelligentAntiflood
                _guild.protection.antiflood = true;                         // Antiflood
                _guild.protection.purgeWebhooksAttacks.enable = true;      // PurgeWebhooksAttacks
                _guild.protection.bloqNewCreatedUsers.enable = true;      // BloqNewCreatedUsers
                _guild.protection.bloqNewCreatedUsers.time = '30d';      // BloqNewCreatedUsers
                _guild.protection.antitokens.enable = true;             // Antitokens
                _guild.protection.cannotEnterTwice.enable = true;      // IntelligentSOS
                _guild.protection.warnEntry = true;                   // WarnEntry
                _guild.protection.kickMalicious.enable = true;       // KickMalicious
                /* Other systems */

                message.reply({ content: `He activado el sistema, para activarlo vuelve a escribir el comando.\nEl sistema raidmode será desactivado automáticamente en \`${ms(time)}\`.`, embeds: [
                    new Discord.MessageEmbed().setColor(0x0056ff).setDescription('`>` __Raidmode preparado:__\n\n1 **::** __Solo el propietario__ puede `gestionar canales`.\n2 **::** __Solo el propietario__ puede `banear miembros`.\n3 **::** __Solo el propietario__ puede `gestionar roles`.\n4 **::** __Solo el propietario__ puede `desactivar este comando`.\n5 **::** __Nadie__ puede `añadir bots`.\n6 **::** __Ningún usuario malicioso__ puede `ingresar al servidor`.\n7 **::** __Todos las cuentas que ingresen al servidor__ deben tener `30 días de antiguedad`.')
                    .addField('> Detección de usuarios y forceban:', 'He activado dos comandos que pueden interesarte: `' + _guild.configuration.prefix + 'forceban` y `' + _guild.configuration.prefix + 'detectar`')
                    .addField('> Sistemas activados a la fuerza:', 'Los siguientes sistemas fueron activados forzosamente: `Antiraid`, `intelligentAntiflood`, `Antiflood`, `purgeWebhooksAttacks`, `bloqNewCreatedUsers`, `Antitokens`, `intelligentSOS`, `warnEntry`, `kickMalicious`, `Antibots`')
                    .addField('> Cuidado al desactivarlo:', 'El sistema raidmode es muy exigente, para desactivarlo deberás escribir la contraseña que se te ha enviado por privado. Si al escribirla fallas la contraseña se desactivará y se sumarán `10 días` hasta que se desactive el raidmode.')
                ] });

                message.content = `${_guild.configuration.prefix}detectar`;
                client.emit('messageCreate', message);
                setTimeout(() => {
                    message.content = `${_guild.configuration.prefix}forceban`;
                    client.emit('messageCreate', message);
                }, 2000);

                updateDataBase(client, message.guild, _guild, true);
            }catch(err) {
                message.reply({ content: `Error: \`${ err }\`` });
            }
        }else{
            message.reply({ content: 'Escribe la contraseña después de este mensaje. Si no la recuerdas o la perdiste ve a mi servidor de soporte.' });
            let collector = message.channel.createMessageCollector({ time: 30000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {
                    if(_guild.protection.raidmode.password == m.content) {
                        message.reply({ content: 'He desactivado el sistema, para activarlo vuelve a escribir el comando.' });
                        _guild.protection.raidmode.enable = false;
                        updateDataBase(client, message.guild, _guild, true);
                    }else{
                        message.reply({ content: 'Contraseña incorrecta, la contraseña ha cambiado y el tiempo para que el sistema se apague automáticamente ha sido ampliado durante 10 días.' });
                        _guild.protection.raidmode.timeToDisable = ms(ms(_guild.protection.raidmode.timeToDisable) + ms('10d'));
                        updateDataBase(client, message.guild, _guild, true);
                    }
                    collector.stop();
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: 'Colector detenido.' });
            });

        }

        _guild.save();
    },
}