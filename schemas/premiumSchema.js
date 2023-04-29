const mongoose = require('mongoose');

const premiumSchema = new mongoose.Schema({
    codes: mongoose.SchemaTypes.Array
});

module.exports = mongoose.model('spagency_PremiumCodes', premiumSchema);