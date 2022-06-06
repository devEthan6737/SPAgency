const mongoose = require('mongoose');

const timersSchema = new mongoose.Schema({
    servers: mongoose.SchemaTypes.Array,
    partners: mongoose.SchemaTypes.Array,
    serversBloqued: mongoose.SchemaTypes.Array,
    maliciousQueue: mongoose.SchemaTypes.Array,
    staff: mongoose.SchemaTypes.Array,
    panels: {
        web: mongoose.SchemaTypes.Array,
        nuclearSafety: mongoose.SchemaTypes.Array,
        SPAgency: mongoose.SchemaTypes.Array,
    }
});

module.exports = mongoose.model('Timers', timersSchema);