const Cacheger = require('cacheger');

class cacheManager extends Cacheger {
    
    constructor(name, base = {}) {
        super(name, base);
    }

    async post(parent, obj) {
        if(this[this.cacheName].size > 5000) this.purgeAll();
        obj.date = Date.now();
        obj.id = parent;
        
        if(!obj.amount) obj.amount = 0;
        if(!obj.remember) obj.remember = [];

        this[this.cacheName].set(parent, obj);
    }

    async up(parent, obj) {
        if(!obj.amount) obj.amount = 0;
        obj.amount = obj.amount + 1;
        if(obj.amount >= 0) this.post(parent, obj);
    }

    async down(parent, obj) {
        if(!obj.amount) obj.amount = 0;
        obj.amount = obj.amount - 1;
        if(obj.amount >= 0) this.post(parent, obj);
    }

    async push(obj, str) {
        if(!obj.remember) obj.remember = [];
        obj.remember.push(str);
        this.post(obj.id, obj);
    }

    async extract(obj, str) {
        if(!obj.remember) obj.remember = [];
        obj.remember.splice(obj.remember.indexOf(str), 1);
        this.post(obj.id, obj);
    }
}

const cacheDatabase = new Map();
let cacheClient;

class cacheManagerDatabase {
    
    constructor(client, type) { client.type = type; cacheClient = client; };

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
