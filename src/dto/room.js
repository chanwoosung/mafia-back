const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    id: String,
    roomName: {
        type: String,
        maxLength: 255,
    },
    amountMafia:  {
        type: Number,
        maxLength: 2,
    },
    amountCitizen: {
        type: Number,
        maxLength: 8,
    },
    userList: [{
        ip: String,
        nickname: String,
        live: Boolean,
    }],
    mafiaList: [{
        ip: String,
        nickname: String,
    }],
    citizenList: [{
        ip: String,
        nickname: String,
    }],
    voteList: [{
        ip: String,
        nickname: String,
    }],
    process: Boolean,
    roomOwner: {
        ip: String,
        nickname: String,
    }
});

module.exports = mongoose.model('Rooms', roomSchema);