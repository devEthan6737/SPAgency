const mongoose = require('mongoose');

const maliciousSchema = new mongoose.Schema({
    // Use UBFB para encontrar miles de maliciosos. Debe contactar con nosotros para obtener un token. discord.gg/RuBvM5r9eM
    userId: mongoose.SchemaTypes.String,
    isMalicious: mongoose.SchemaTypes.Boolean,
    reason: mongoose.SchemaTypes.String,
    proof: mongoose.SchemaTypes.String,
    punishment: mongoose.SchemaTypes.Number,
    appealStatus: mongoose.SchemaTypes.String,
    record: mongoose.SchemaTypes.String
});

module.exports = mongoose.model('Malicious', maliciousSchema);