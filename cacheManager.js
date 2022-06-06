// No es recomendable tocar algo de aquí si no sabes lo que haces.
// Tiempo de respuesta estimado: 0ms-1ms

const cache = new Map();

class cacheManager {
    
    constructor() {}

    async post(parent, obj) {
        if(cache.size > 5000) this.purge();
        obj.date = Date.now(); obj.id = parent;
        if(!obj.amount) obj.amount = 0; if(!obj.remember) obj.remember = [];
        cache.set(parent, obj);
    }

    async delete(parent) {
        if(cache.has(parent)) cache.delete(parent);
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

    async get(parent, disableAutoCreate = false) {
        if(!cache.has(parent) && disableAutoCreate == false) this.post(parent, {});
        return await cache.get(parent);
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

    async purge() {
        cache.forEach(async x => {
            if(Date.now() > x.date + 120000) this.delete(x.id);
        });
    }

    async purgeAll() {
        cache.clear();
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