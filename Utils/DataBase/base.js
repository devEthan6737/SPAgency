const Discord = require('discord.js-light');
const Guild = require('../../schemas/guildsSchema');
const package = require('../../package.json');

module.exports = {
    setGuildBase: (guild) => {
        return (new Guild({
            id: guild.id,
            ownerId: guild.ownerId,

            protection: {
                antiraid: { enable: true, amount: 0 },
                antibots: { enable: false, _type: 'all' },
                antitokens: { enable: false, usersEntrities: [], entritiesCount: 0 },
                antijoins: { enable: false, rememberEntrities: [] },
                markMalicious: { enable: true, _type: 'changeNickname', rememberEntrities: [] },
                warnEntry: true,
                kickMalicious: { enable: false, rememberEntrities: [] },
                ownSystem: { enable: false },
                verification: { enable: false },
                cannotEnterTwice: { enable: false, users: [] },
                purgeWebhooksAttacks: { enable: false, amount: 0, rememberOwners: 'Nadie' },
                intelligentSOS: { enable: false, cooldown: false },
                intelligentAntiflood: false,
                antiflood: true,
                bloqEntritiesByName: { enable: false, names: ['raider', 'doxer', 'hacker', 'infecter'] },
                bloqNewCreatedUsers: { time: '1h' },
                raidmode: { enable: false, timeToDisable: '1d', password: 'Nothing', activedDate: 0 }
            },

            moderation: {
                dataModeration: { events: { manyPings: true, capitalLetters: false, manyEmojis: false, manyWords: false, linkDetect: false, ghostping: true, nsfwFilter: false, iploggerFilter: true }, },
                automoderator: {
                    enable: false,
                    actions: { warns: [ 3, 5 ], muteTime: [ 3600000, '10h' ], action: 'BAN', linksToIgnore: [ '.gif', '.png', '.jpg', '.txt', '.mp3' ], floodDetect: 5, manyEmojis: 4, manyPings: 4, manyWords: 250 },
                    events: { badwordDetect: true, floodDetect: true, manyPings: true, capitalLetters: false, manyEmojis: false, manyWords: false, linkDetect: true, ghostping: true, nsfwFilter: false, iploggerFilter: true },
                },
            },

            configuration: {
                _version: package.version,
                prefix: 'sp!',
                language: 'es',
                password: { enable: false, _password: '', usersWithAcces: [] },
                subData: { showDetailsInCmdsCommand: 'lessDetails', pingMessage: 'allDetails', dontRepeatTheAutomoderatorAction: false },
            },
        })).save();
    },
    fetch: async (guild, baseDocument) => {
        let document = await Discord.client.database.guilds.get(guild.id) || await Guild.findOne({ id: guild.id });

        if(!document) document = module.exports.setGuildBase(guild);
        Discord.client.database.guilds.set(guild.id, baseDocument ?? document);

        return document;
    },
    update: async (guild, document) => {
        if(Discord.client.database.guilds.has(guild.id)) {
            Discord.client.database.guilds.update(guild.id, document);
            await Guild.findOneAndUpdate({ id: guild.id }, document);
        }else module.exports.fetch(guild, document);
    }
};