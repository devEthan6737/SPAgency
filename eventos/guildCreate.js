const Discord = require('discord.js-light');
const antiRF = require('../schemas/antiRF_Schema');
const Timers = require('../schemas/timersSchema');
const install_commands = require('../install');

module.exports = async (client, guild) => {
    try{
        if(guild != undefined) {
            await install_commands(client, guild);

            // Notificación de nuevo gremio.
            client.channels.cache.get('822642842098597958').send({ embeds: [ new Discord.MessageEmbed().setThumbnail(`${guild.iconURL()}`).setTitle('Nuevo Servidor.').addField('Servidor', `${guild.name} (${guild.id})`).addField('Region', `${guild.region}`).addField('Roles', `${guild.roles.cache.size}`).addField('Miembros', `${guild.memberCount}`).setTimestamp().setColor(0x0056ff).setFooter(`${guild.name}`, `${guild.iconURL()}`) ] });

            // Requiriendo usuario de mongoose:
            let user = await antiRF.findOne({ user: guild.ownerId });
            let _timers = await Timers.findOne({ });
            let se = _timers.serversBloqued;
            let founder = client.users.cache.get(guild.ownerId);
            if (!founder) founder = await client.users.fetch(guild.ownerId, true, true);

            if(user.isBloqued == true) {
                founder.send('Los usuarios demasiado peligrosos no pueden añadir a `SP Agency` en su servidor por razones obvias.').catch(err => {});
                guild.leave();
            }else if(se.includes(guild.id)) {
                founder.send('Tu servidor está bloqueado, eso significa que debo salir de este.').catch(err => {});
                guild.leave();
            }else{
                founder.send({ embeds: [ new Discord.MessageEmbed()
                    .setAuthor(`${guild.name}`, `${guild.iconURL()}`)
                    .setDescription('SP Agency, versión 6:\n\n```[+] Autosuficiente.\n[+] Avanzado.\n[+] Innovador.\n[+] Sencillo.\n[+] Característico.\n[+] Seguro.\n[+] Cumple lo que promete.\n[+] Desarrollado con cariño.```')
                    .addField('<:proteccion:780163156902543370> | La mejor seguridad hispanohablante:', 'Comienza con el bot antiraider más eficaz, inteligente y avanzado.')
                    .addField('<:mod:780163163421278228> | Deja el martillo morado, usa el nuestro:', 'Hemos creado una moderación enfocada a tus gustos.')
                    .addField('<:config:780163162993328138> | Configuración extensa y adaptada:', 'Nuestro bot es como una tarta, ¡puedes cambiar todos sus ingredientes!')
                    .addField('<:otros:780163159553605653> | Soporte ampliado:', '¿Preguntas o problemas? ¡Estamos ansiosos por mimarte!')
                    .setColor(0x0056ff),
                ], components: [
                    new Discord.MessageActionRow()
                    .addComponents(new Discord.MessageButton()
                        .setLabel('Discord de Soporte')
                        .setEmoji('⛑')
                        .setURL('https://discord.gg/RuBvM5r9eM')
                        .setStyle('LINK'),
                    )
                    .addComponents(new Discord.MessageButton()
                        .setLabel('Empezar')
                        .setEmoji('🛑')
                        .setURL(`https://discord.com/channels/${guild.id}/`)
                        .setStyle('LINK'),
                    )
                    .addComponents(new Discord.MessageButton()
                        .setLabel('Tutorial de configuración')
                        .setEmoji('🦮')
                        .setURL(`https://youtu.be/74h55oEyy4U`)
                        .setStyle('LINK'),
                    )
                ] }).catch(err => {});
            }

            // Achievements:
            if(user && user.achievements.data.serversCreatedTotally >= 10 && !user.achievements.array.includes('Rey de gremios.')) {
                user.achievements.array.push('Rey de gremios.');
                user.save();
            }

            // Activar el config por defecto al añadir al bot:
            setTimeout(async () => {
                if(user.serversCreated.date != new Date().getDay()) user.serversCreated = {
                    servers: 1,
                    date: new Date().getDay()
                };

                if(user.serversCreated.date == new Date().getDay() && user.serversCreated.servers == 3) {
                    founder.send('¡Para el carro colega! Hoy ya me has añadido en tres servidores, me podrás añadir mañana.');
                    guild.leave();
                }else if(user.serversCreated.date == new Date().getDay() && user.serversCreated.servers != 3) {
                    user.serversCreated.servers = user.serversCreated.servers + 1;
                }
                user.save();
            }, 3000);
        }
    }catch(err) {}
}