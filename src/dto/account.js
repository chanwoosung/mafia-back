const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    ip: String,
    nickname: String,
    job: String,
});

module.exports = mongoose.model('Accounts', accountSchema);