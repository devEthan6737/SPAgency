// No es recomendable tocar algo de aquí si no sabes lo que haces.

const Discord = require('discord.js-light');
const Timers = require('./schemas/timersSchema');
const Warns = require('./schemas/warnsSchema');

async function automoderator(client, mongoose, message, sanctionReason) {
    let userWarns = await Warns.findOne({ guildId: message.guild.id, userId: message.author.id });
    if(!userWarns) {
        let newUser = new Warns({
            guildId: message.guild.id,
            userId: message.author.id,
            warns: [],
            subCount: 1
        });
        userWarns = newUser;
        newUser.save();
        return;
    }

    if(userWarns.subCount >= 2) {
        userWarns.subCount = 0;

        userWarns.warns.push({
            reason: sanctionReason,
            moderator: `${client.user.id}`
        });
        userWarns.save();

        message.reply({ embeds: [ new Discord.MessageEmbed().setColor(0x0056ff).setDescription(`<@${message.author.id}>, has sido advertido.\n\nRazón: \`${sanctionReason}\`\nModerador: \`${client.user.tag}\``) ] });

        if(userWarns.warns.length == mongoose.moderation.automoderator.actions.warns[0]) {
            if(message.member.roles.cache.has(mongoose.moderation.dataModeration.muterole))return;
            if(!message.guild.me.permissions.has('MANAGE_ROLES')) {
                client.users.cache.get(message.guild.ownerId).send('No tengo permisos para mutear a un usuario, he desactivado el automoderador.').catch(err => {
                    message.channel.send('<@' + message.guild.ownerId + '>, no tengo permisos para mutear al usuario, he desactivado el automoderador.');
                });
                mongoose.moderation.automoderator.enable = false;
                mongoose.save();
                return;
            }
            let remember = [];

            try{
                message.member.roles.cache.forEach(x => {
                    remember.push(x.id);
                    message.member.roles.remove(x.id).catch(err => {});
                });
            
                message.member.roles.add(mongoose.moderation.dataModeration.muterole).catch(err => {
                    message.channel.send(err);
                });
            }catch(err) {
                message.channel.send(err);
            }
            mongoose.moderation.dataModeration.timers.push({
                user: {
                    id: message.author.id,
                    username: message.author.username,
                    roles: remember
                },
                endAt: Date.now() + mongoose.moderation.automoderator.actions.muteTime[0],
                action: 'UNMUTE',
                channel: message.channel.id,
                inputTime: mongoose.moderation.automoderator.actions.muteTime[1]
            });
            mongoose.save();
            let _timers = await Timers.findOne({ });
            if(!_timers.servers.includes(message.guild.id)) {
                _timers.servers.push(message.guild.id);
                _timers.save();
            }
            message.reply({ content: `He muteado a \`${message.author.username}\` durante \`${mongoose.moderation.automoderator.actions.muteTime[1]}\` por tener demasiadas infracciónes.` });
        }else if(userWarns.warns.length > mongoose.moderation.automoderator.actions.warns[1]) {
            if(mongoose.moderation.automoderator.actions.action == 'BAN') {
                if(!message.guild.me.permissions.has('BAN_MEMBERS')) {
                    client.users.cache.get(message.guild.ownerId).send('No tengo permisos para banear a un usuario, he desactivado el automoderador.').catch(err => {
                        message.channel.send('<@' + message.guild.ownerId + '>, no tengo permisos para banear al usuario, he desactivado el automoderador.');
                    });
                    mongoose.moderation.automoderator.enable = false;
                    mongoose.save();
                    return;
                }
                message.guild.members.ban(message.author.id).then(() => {
                    message.channel.send('He baneado al usuario.');
                }).catch(err => {});
                return;
            }else{
                if(!message.guild.me.permissions.has('KICK_MEMBERS')) {
                    client.users.cache.get(message.guild.ownerId).send('No tengo permisos para expulsar a un usuario, he desactivado el automoderador.').catch(err => {
                        message.channel.send('<@' + message.guild.ownerId + '>, no tengo permisos para expulsar al usuario, he desactivado el automoderador.');
                    });
                    mongoose.moderation.automoderator.enable = false;
                    mongoose.save();
                    return;
                }
                message.guild.members.kick(message.author.id).then(() => {
                    message.channel.send('He expulsado al usuario.');
                }).catch(err => {});
                return;
            }
        }
        return;
    }else{
        userWarns.subCount = userWarns.subCount + 1;
        userWarns.save();
    }
}

module.exports = {
    automoderator
}
