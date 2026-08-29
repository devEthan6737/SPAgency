const Discord = require('discord.js-light');
const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'verification',
	category: 'Protección',
    premium: false,
	alias: ['verify', 'setverify', 'verificacion', 'verificación'],
	description: 'Activa un sistema para evitar selfbots de forma segura.',
	usage: ['<prefix>verification'],
    run: async (client, message, args, _guild) => {
        if(!message.guild.me.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send('Necesitas permiso de __Administrador__.');

        if(_guild.protection.verification.enable == false) {
            _guild.protection.verification.enable = true;

            message.channel.send({ embeds: [
                new Discord.MessageEmbed().setColor(0x0056ff).setDescription('Estoy activando el sistema de verificación, mientras tanto dime el tipo de verificación que deseas establecer:')
                .addField('Verificación tipo 1:', '`Una verificación manual, escribiendo el comando "' + _guild.configuration.prefix + 'verify <userMention>".`\n\n**Activar con:**\n--v1 <channelMention> <roleMention>\n**Ejemplo:**\n--v1 <#' + message.guild.channels.cache.filter(x => x.type == 'GUILD_TEXT').random().id + '> <@&' + message.guild.roles.cache.random().id + '>')
                .addField('Verificación tipo 2:', '`Una verificación recolectando mensajes. Cuando se detecte una entrada de un usuario en el servidor, SP Agency enviará un código que el usuario deberá repetir.`\n\n**Activar con:**\n--v2 <channelMention> <roleMention>\n**Ejemplo:**\n--v2 <#' + message.guild.channels.cache.filter(x => x.type == 'GUILD_TEXT').random().id + '> <@&' + message.guild.roles.cache.random().id + '>')
                .addField('Verificación tipo 3:', '`Verificación con botones. Cuando un usuario entre en el servidor deberá pulsar un botón en el canal mencionado para que se le agregue el rol de verificado.`\n\n**Activar con:**\n--v3 <channelMention> <roleMention> [buttonContent] /split/ [messageContent]\n**Ejemplo:**\n--v3 <#' + message.guild.channels.cache.filter(x => x.type == 'GUILD_TEXT').random().id + '> <@&' + message.guild.roles.cache.random().id + '> Verificar. /split/ ¡Haz click en el botón de abajo para verificarte!')
                .addField('Verificación tipo 4:', '`Una verificación completamente automática que se basará en el sistema antitokens. Si el bot no detecta ningún problema, se le agregará el rol de usuario verificado.`\n\n**Activar con:**\n--v4 <roleMention>\n**Ejemplo:**\n--v4 <@&' + message.guild.roles.cache.random().id + '>')
            ] });
            let collector = message.channel.createMessageCollector({ time: 60000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {
                    if(m.content.split(' ')[0] != '--v1' && m.content.split(' ')[0] != '--v2' && m.content.split(' ')[0] != '--v3' && m.content.split(' ')[0] != '--v4') {
                        message.reply({ content: 'No has escrito el tipo de verificación.' });
                        collector.stop();
                        return;
                    }
                    let channelMention;
                    if(m.content.split(' ')[0] != '--v4') {
                        channelMention = m.mentions.channels.first();
                        if(!channelMention) {
                            message.reply(await dataRequired('Necesitas mencionar un canal.\n\n' + m.content.split(' ')[0] + ' <channelMention> <roleMention>'));
                            collector.stop();
                            return;
                        }
                        if(!message.guild.channels.cache.has(channelMention.id)) {
                            message.reply(await dataRequired('¡El canal mencionado debe estar en este servidor!\n\n' + m.content.split(' ')[0] + ' <channelMention> <roleMention>'));
                            collector.stop();
                            return;
                        }
                        if(!channelMention.parentId) {
                            message.reply('`Error 003`: Channel must be on this guild.');
                            collector.stop();
                            return;
                        }
                        _guild.protection.verification.channel = channelMention.id;
                    }
                    let roleMention = m.mentions.roles.first();
                    if(!roleMention) {
                        message.reply(await dataRequired('Debes mencionar el rol que deseas establecer como rol de verificación.\n\n' + m.content.split(' ')[0] + ' <channelMention> <roleMention>'));
                        collector.stop();
                        return;
                    }
                    if(message.member.roles.highest.position <= roleMention.position) {
                        message.reply('Ese rol está más alto que tu rol o tiene la misma posición.');
                        collector.stop();
                        return;
                    }
                    if(!message.guild.roles.cache.has(roleMention.id)) {
                        message.reply('Este server no tiene ningún rol con esa id.');
                        collector.stop();
                        return;
                    }
                    
                    _guild.protection.verification._type = m.content.split(' ')[0];
                    _guild.protection.verification.role = roleMention.id;

                    if(m.content.split(' ')[0] == '--v1') {
                        message.channel.send({ content: 'Sistema activado, ahora puedes verificar miembros con `' + _guild.configuration.prefix + 'verify <userMention>`' });
                    }else if(m.content.split(' ')[0] == '--v2') {
                        message.channel.send({ content: 'Sistema activado, ahora cuando se una un usuario enviaré en el canal de verificación un código como este: `aB.1f.k0`.' });
                    }else if(m.content.split(' ')[0] == '--v3') {
                        let buttonContent = 'No soy un robot.';
                        let messageContent = '¡Bienvenido! Debes presionar el botón adjunto para ver los demás canales y demostrar que no eres un robot con orejas de gato.';
                        if(m.content.split(`${roleMention.id}> `)[1]) buttonContent = m.content.split(`${roleMention.id}> `)[1];
                        if(m.content.split(' /split/ ')[1]) {
                            buttonContent = m.content.split(`${roleMention.id}> `)[1].split(' /split/ ')[0];
                            messageContent = m.content.split(' /split/ ')[1];
                        }

                        client.channels.cache.get(channelMention.id).send({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`${messageContent}`) ], components: [ new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('verifyButton').setLabel(`${buttonContent}`).setStyle('PRIMARY')) ] });
                        message.channel.send({ content: 'Sistema activado, ya he enviado el botón en el canal de verificación.' });
                    }else if(m.content.split(' ')[0] == '--v4') {
                        if(_guild.protection.antitokens.enable == false) {
                            _guild.protection.antitokens.enable = true;
                            message.channel.send({ content: 'He activado el sistema antitokens, debe estar así para que la verificación funcione.' });
                        }
                        message.channel.send({ content: 'Sistema activado, ahora verificaré miembros basándome en el sistema antitokens.' });
                    }
                    collector.stop();
                    updateDataBase(client, message.guild, _guild, true);
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: 'Colector detenido.' });
            });
        }else{
            _guild.protection.verification.enable = false;
            if(_guild.protection.verification._type == '--v4') {
                _guild.protection.antitokens.enable == false;
                message.channel.send({ content: 'Se activó el antitokens para que la verificación de tipo 4 funcione, lo he desactivado.' });
            }
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Verificación automática desactivada.' });
        }

    },
}