const mongoose = require('mongoose');

const warnsSchema = new mongoose.Schema({
    guildId: mongoose.SchemaTypes.String,
    userId: mongoose.SchemaTypes.String,
    warns: mongoose.SchemaTypes.Array,
    subCount: mongoose.SchemaTypes.Number
});

module.exports = mongoose.model('Warns', warnsSchema);