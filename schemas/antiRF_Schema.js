const mongoose = require('mongoose');

const antiRF_Schema = new mongoose.Schema({
    user: mongoose.SchemaTypes.String,
    content: mongoose.SchemaTypes.String,
    amount: mongoose.SchemaTypes.Number,
    isBloqued: mongoose.SchemaTypes.Boolean,
    isToken: mongoose.SchemaTypes.Boolean,
    achievements: {
        array: mongoose.SchemaTypes.Array,
        data: {
            bugs: mongoose.SchemaTypes.Number,
            serversCreatedTotally: mongoose.SchemaTypes.Number,
            serversPartner: mongoose.SchemaTypes.Array,
            reports: mongoose.SchemaTypes.Number,
            totalVotes: mongoose.SchemaTypes.Number,
            initialMember: mongoose.SchemaTypes.Boolean
        }
    },
    serversCreated: {
        servers: mongoose.SchemaTypes.Number,
        date: mongoose.SchemaTypes.String,
    },
    premium: {
        isActive: mongoose.SchemaTypes.Boolean,
        endAt: mongoose.SchemaTypes.Number
    },
    servers: mongoose.SchemaTypes.Array
});

module.exports = mongoose.model('antiRF', antiRF_Schema);