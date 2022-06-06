const Guild = require('../schemas/guildsSchema');
const { selectMenu, pulk, fecthDataBase, updateDataBase } = require('../functions');
const Discord = require('discord.js-light');

module.exports = async (client, interaction) => {
    let _guild = await fecthDataBase(client, interaction.guild, false);
    if(!_guild)return;

    // Logs:
    try{
        if(_guild.configuration.logs[0]) {
            let type;
            if(interaction.isCommand()) {
                type = 'Command.';
            }else if(interaction.isSelectMenu()) {
                type = 'SelectMenu.';
            }else{
                type = 'Button.';
            }
            client.channels.cache.get(_guild.configuration.logs[0]).send({ content: '`LOG:` Interacción creada.', embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setAuthor(interaction.user.tag, interaction.user.displayAvatarURL()).setDescription(`\`Tipo de interacción:\` __${type}__`) ] }).catch(err => {});
        }
    }catch(err) {
        client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (interactionCreate): \`${err}\`` }).catch(() => {});
        _guild.configuration.logs = [];
    }

    if(interaction.customId == 'newPage' || interaction.customId == 'returnPage')return // Return buttons of rz's pages.

    try{
        if(interaction.isSelectMenu()) {
            await selectMenu(interaction, interaction.values[0], client);
        }else if(interaction.isButton()) {
            if(interaction.customId == 'verifyButton') {
                if(_guild.protection.verification.enable == true && _guild.protection.verification._type == '--v3') {
                    interaction.reply({ content: 'Verificando...', ephemeral: true });
                    interaction.member.roles.add(_guild.protection.verification.role).catch(err => {
                        client.channels.cache.get(_guild.protection.verification.channel).send({ content: 'Error al agregarte el rol.\n\n`' + err + '`', ephemeral: true });
                    });
                }

            }else if(interaction.customId == 'unmuteAll') {
                if(!interaction.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
                let count = 0;
                _guild.moderation.dataModeration.timers.forEach(async x => {
                    try{
                        _guild.moderation.dataModeration.timers = await pulk(_guild.moderation.dataModeration.timers, x);
                        x.endAt = Math.random();
                        x.inputTime = '0s';
                        _guild.moderation.dataModeration.timers.push(x);
                        setTimeout(() => {
                            updateDataBase(client, interaction.guild, _guild, true);
                        }, 120000 * count++);
                    }catch(err) {}
                });

                interaction.reply({ content: 'Todos los usuarios serán desmuteados a lo largo del día.' });
            }else if(interaction.customId == 'dontRepeatTheAutomoderatorAction') {
                if(!interaction.member.permissions.has('ADMINISTRATOR'))return interaction.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: true });
                if(_guild.configuration.subData.dontRepeatTheAutomoderatorAction == false) {
                    _guild.configuration.subData.dontRepeatTheAutomoderatorAction = true;
                    interaction.reply({ content: 'No volveré a mutear/banear/expulsar a alguien cuando tenga demasiadas infracciónes.', ephemeral: true });
                }else{
                    _guild.configuration.subData.dontRepeatTheAutomoderatorAction = false;
                    interaction.reply({ content: 'Comenzaré a mutear/banear/expulsar a alguien cuando tenga demasiadas infracciónes.', ephemeral: true });
                }
            }
        }
    }catch(err) {}

    updateDataBase(client, interaction.guild, _guild, true);
}