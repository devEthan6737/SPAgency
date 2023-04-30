/*
LEA LA LICENCIA Y/O EL README ANTES DE:
MODIFICAR, COPIAR, MEJORAR, BASAR CÓDIGO U OTRO QUE TENGA QUE VER CON ESTE.

---------------------------------------------------------------------------
------- PARA LOS QUE SABEMOS QUE NO HARÁN CASO AL MENSAJE DE ARRIBA -------
---------------------------------------------------------------------------

Copie, modifique, mejore o base este código siempre que obtengamos créditos
como "THE INDIE BRAND", "SPA BY TIB" - O similares.

Por defecto, estos créditos ya están agregados al código. No debe editarlo
si lo encuentra. Si lo hace, no olvide agregarlos en otro lado del código
el cual sea mostrado por el bot.

Vaya al archivo .env para editar la configuración.

---------------------------------------------------------------------------
---------------------------------------------------------------------------
---------------------------------------------------------------------------
*/

require('dotenv').config();
const fs = require('fs');
const package = require('./package.json');
const Discord = require('discord.js-light');
const client = new Discord.Client({
    shards: 'auto',
    makeCache: Discord.Options.cacheWithLimits({
        ApplicationCommandManager: 0, // guild.commands
        BaseGuildEmojiManager: Infinity, // guild.emojis
        ChannelManager: Infinity, // client.channels
        GuildChannelManager: Infinity, // guild.channels
        GuildBanManager: Infinity, // guild.bans
        GuildInviteManager: 0, // guild.invites
        GuildManager: Infinity, // client.guilds
        GuildMemberManager: Infinity, // guild.members
        GuildStickerManager: 0, // guild.stickers
        GuildScheduledEventManager: 0, // guild.scheduledEvents
        MessageManager: Infinity, // channel.messages
        PermissionOverwriteManager: Infinity, // channel.permissionOverwrites
        PresenceManager: 0, // guild.presences
        ReactionManager: 0, // message.reactions
        ReactionUserManager: 0, // reaction.users
        RoleManager: Infinity, // guild.roles
        StageInstanceManager: 0, // guild.stageInstances
        ThreadManager: 0, // channel.threads
        ThreadMemberManager: 0, // threadchannel.members
        UserManager: Infinity, // client.users
        VoiceStateManager: 0 // guild.voiceStates
    }),
    intents: [ Discord.Intents.FLAGS.GUILDS, "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_BANS", "GUILDS", "GUILD_EMOJIS_AND_STICKERS", "GUILD_INVITES", "GUILD_WEBHOOKS", "GUILD_INTEGRATIONS", "GUILD_VOICE_STATES", "DIRECT_MESSAGES", "DIRECT_MESSAGE_TYPING", "GUILD_MESSAGE_TYPING", "GUILD_SCHEDULED_EVENTS" ],
    partials: [ 'CHANNEL', 'GUILD_MEMBER', 'GUILD_SCHEDULED_EVENT', 'MESSAGE', 'REACTION', 'USER' ]
});

const mongoose = require('mongoose');
mongoose.connect(process.env.TURN_ON_CANARY === 'true' ? process.env.CANARY_BOT_DB : process.env.BOT_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a mongoose.');
}).catch(err => console.log(err));

const { cacheManager, cacheManagerDatabase } = require('./cacheManager');
client.super = {
    cache: new cacheManager('utils') // Caché para datos útiles.
};
client.database = {
    guilds: new cacheManagerDatabase(client, 'g'), // Caché para servidores.
    users: new cacheManagerDatabase(client, 'u') // Caché para usuarios.
};

client.login(process.env.TURN_ON_CANARY === 'true' ? process.env.CANARY_BOT_TOKEN : process.env.BOT_TOKEN).then(async () => {
    console.log(`${client.user.tag} (${client.user.id}) se ha encendido con ${client.guilds.cache.size} servidores. Versión: ${package.version}.`);

    // UBFB obsoleto por el momento.
    client.ubfb = {};
    // const ubfb = require('ubfb');
    // client.ubfb = new ubfb(client, {
    //     token: process.env.UBFB_TOKEN,
    //     password: process.env.UBFB_PASSWORD
    // });

    // ---------------------------------------------
    /* ----- Command + Event + Error Handler -----*/
    // ---------------------------------------------

    client.comandos = new Discord.Collection();
    for(const file of fs.readdirSync('./eventos/')) {
        if(file.endsWith('.js')) {
            const fileName = file.substring(0, file.length - 3);
            const fileContents = require(`./eventos/${file}`);
            client.on(fileName, fileContents.bind(null, client));
            delete require.cache[require.resolve(`./eventos/${file}`)];
        }
    }

    for(const subcarpeta of fs.readdirSync('./comandos/')) { 
        for(const file of fs.readdirSync('./comandos/' + subcarpeta)) { 
            if(file.endsWith(".js")) {
                let fileName = file.substring(0, file.length - 3); 
                let fileContents = require(`./comandos/${subcarpeta}/${file}`); 
                client.comandos.set(fileName, fileContents);
            }
        }
    }

    // ---------------------------------------------
    /* ----- Command + Event + Error Handler -----*/
    // ---------------------------------------------

});

process.on('unhandledRejection', (err) => {
    console.error(err);
});

/*
ARCHIVOS QUE NO USAN SISTEMA DE LENGUAJES:
1 guildMemberAdd a partir de la linea 214
2 interactionCreate
3 messageCreate
4 messageUpdate
5 functions

6 reporte
7 rz
8 staff
9 sugerencia
10 comandos, el embed

11 channel
12 editpingreply
13 guild
14 ignorethischannel
15 language
16 logs
17 member
18 ping
19 setmuterole
20 setprefix
21 unnuke
22 verify
23 whitelist

24 badword
25 ban
26 baninfo
27 capital-letters
28 clear
39 detectar
30 forceban
31 forcereason
32 globalban
33 globalkick
34 hackban
35 kick
36 linkdetect
37 manyemojis
38 manypings
39 manywords
40 message
41 mute
42 muteinfo
43 nuke
44 snipe
45 support
46 tempban
47 predict

- Comandos como autoconfig, verificación, raidmode, backup, automoderador... tampoco están traducidos
ni actualizados, se planeaba un cambio grande para estos.
*/
