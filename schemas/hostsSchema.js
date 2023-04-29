const mongoose = require('mongoose');

const hostsSchema = new mongoose.Schema({
    // Estos datos pertenecen a RZ (ORG). Debemos mantener su privacidad.
});

module.exports = mongoose.model('spagency_Hosts', hostsSchema);