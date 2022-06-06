const mongoose = require('mongoose');

const backupsSchema = new mongoose.Schema({
    guildId: mongoose.SchemaTypes.String,
    enable: mongoose.SchemaTypes.Boolean,
    password: mongoose.SchemaTypes.Number,
    name: mongoose.SchemaTypes.String,
    icon: mongoose.SchemaTypes.String,
    channels: {
        category: mongoose.SchemaTypes.Array,
        text: mongoose.SchemaTypes.Array,
        noCategory: mongoose.SchemaTypes.Array
    },
    roles: mongoose.SchemaTypes.Array,
    bans: mongoose.SchemaTypes.Array 
});

module.exports = mongoose.model('Backup', backupsSchema);