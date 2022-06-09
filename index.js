/*
LEA LA LICENCIA ANTES DE MODIFICAR, COPIAR, MEJORAR, BASAR CÓDIGO U OTRO QUE TENGA QUE VER CON ESTE

Explicaciones básicas:
- Necesita un conocimiento intermedio en NODEJS para entender el código, encuentre cursos en yt.
- Ese archivo gestiona el bot canario (de pruebas) y el bot oficial, podrá intercambiar entre TRUE (si quieres encender el bot canario) o FALSE (para encender el bot oficial) dentro de PACKAGE.JSON, valor "canary"
- El código tiene algunas fallas si lo desea implementar en un bot con más de 6.0000 servidores.
- Los lenguajes no están terminados, deberá esperar a que algún desarrollador desee acabarlo o terminarlos por usted mismo. Ruta: ./LANG/es
- Probablemente encuentre partes de código desactualizadas, su mayoría debido a que provienen de v12. Funcionales pero puede cambiarlo a su gusto.
- Puede encontrar el gestor de caché en ./cacheManager.js
- No hay módulos instalados, use "npm i" en la terminal para instalar todos los módulos del package.
- Mantenga siempre discord.js-light en su última versión si usa shards.
- En nuevos comandos requiera siempre discord.js-light y no discord.js
- Encontrarás código con ids de nuestros antiguos servidores o canales, cambialos.
*/

require('dotenv').config();
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
});

const mongoose = require('mongoose');
mongoose.connect(package.canary? process.env.CANARY_BOT_DB : process.env.BOT_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a mongoose.');
}).catch(err => console.log(err));

const { cacheManager, cacheManagerDatabase } = require('./cacheManager');
client.super = {
    cache: new cacheManager() // Caché para datos útiles.
}
client.database = {
    guilds: new cacheManagerDatabase(client, 'g'), // Caché para servidores.
    users: new cacheManagerDatabase(client, 'u') // Caché para usuarios.
}

client.on("shardConnect", async (shardId, guilds) => {
    console.log('Shard num' + shardId + ': LANZADO PARA ' + guilds.length + ' SERVIDORES.');
});

client.login(package.canary? process.env.CANARY_BOT_TOKEN : process.env.BOT_TOKEN).then(async () => {
    console.log(`${client.user.tag} (${client.user.id}) se ha encendido con ${client.guilds.cache.size} servidores. Versión: ${package.version}.`);

    const ubfb = require('ubfb');
    client.ubfb = new ubfb(client, {
        token: process.env.UBFB_TOKEN,
        password: process.env.UBFB_PASSWORD
    });

    // ------------------------------------
    /* ----- Command + Event handler -----*/
    // ------------------------------------

    const { readdirSync } = require('fs');
    client.comandos = new Discord.Collection();
    for(const file of readdirSync('./eventos/')) {
        if(file.endsWith('.js')) {
            const fileName = file.substring(0, file.length - 3);
            const fileContents = require(`./eventos/${file}`);
            client.on(fileName, fileContents.bind(null, client));
            delete require.cache[require.resolve(`./eventos/${file}`)];
        }
    }

    for(const subcarpeta of readdirSync('./comandos/')) { 
        for(const file of readdirSync('./comandos/' + subcarpeta)) { 
            if(file.endsWith(".js")) {
                let fileName = file.substring(0, file.length - 3); 
                let fileContents = require(`./comandos/${subcarpeta}/${file}`); 
                client.comandos.set(fileName, fileContents);
            }
        }
    }

    // ------------------------------------
    /* ----- Command + Event handler -----*/
    // ------------------------------------

    if(!package.canary) {
        // Si no te interesa publicar tus datos a DBH, elimina de la linea 92 a 96.
        const DanBotHosting = require("danbot-hosting");
        client.danbot = new DanBotHosting.Client(process.env.DANBOT_TOKEN, client);
        try{ await client.danbot.autopost(); }catch(err) {};
    }

});

process.on('unhandledRejection', async (err) => {
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