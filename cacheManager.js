const Cacheger = require('cacheger');
const Discord = require('discord.js-light');

class cacheManager extends Cacheger {
    
    constructor(name, base = {}, metadatable = true) {
        super(name, base);

        this.metadatable = metadatable;
    }

    post(parent, obj) {
        if(this[this.cacheName].size > 5000) this.purgeAll();
        if(this.metadatable) obj.date = Date.now();
        if(this.metadatable) obj.id = parent;
        if(this.metadatable && !obj.amount) obj.amount = 0;
        if(this.metadatable && !obj.remember) obj.remember = [];

        this[this.cacheName].set(parent, obj);
    }

    up(parent, obj) {
        if(!this.metadatable)return this.post(parent, obj);

        if(!obj.amount) obj.amount = 0;
        obj.amount = obj.amount + 1;
        if(obj.amount >= 0) this.post(parent, obj);
    }

    down(parent, obj) {
        if(!this.metadatable)return this.post(parent, obj);

        if(!obj.amount) obj.amount = 0;
        obj.amount = obj.amount - 1;
        if(obj.amount >= 0) this.post(parent, obj);
    }

    push(obj, str) {
        if(!this.metadatable)return this.post(parent, obj);

        if(!obj.remember) obj.remember = [];
        obj.remember.push(str);
        this.post(obj.id, obj);
    }

    extract(obj, str) {
        if(!this.metadatable)return this.post(parent, obj);

        if(!obj.remember) obj.remember = [];
        obj.remember.splice(obj.remember.indexOf(str), 1);
        this.post(obj.id, obj);
    }

    setGuildBase(parent) {
        this.post(parent, {
            snipes: {
                editeds: [
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } },
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } },
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } },
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } },
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } }
                ],
                deleteds: [
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } },
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } },
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } },
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } },
                    { tag: Discord.client.user.tag, displayAvatarURL: Discord.client.user.displayAvatarURL(), content: '...', at: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, attachments: { firstAttachment: undefined, rest: 0 } }
                ]
            }
        });
    }
}

const cacheDatabase = new Map();
let cacheClient;

class cacheManagerDatabase {
    
    constructor(client, type) {
        client.type = type;
        cacheClient = client;
    };

    async post(parent, obj) {
        obj.id = parent;
        cacheDatabase.set(parent, obj);
    }

    async delete(parent) {
        if(cacheDatabase.has(parent)) cacheDatabase.delete(parent);
    }

    async get(parent, disableAutoCreate = false) {
        if(!cacheDatabase.has(parent) && disableAutoCreate == false) this.post(parent, {});
        return await cacheDatabase.get(parent);
    }

    async purgeAll() {
        cacheDatabase.clear();
    }
}

module.exports = {
    cacheManager, cacheManagerDatabase
};