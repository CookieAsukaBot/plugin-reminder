const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const schema = new Schema({
    userID: {
        type: String,
        required: true
    },
    dm: {
        type: Boolean,
        default: false,
        required: true
    },
    guild: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        required: true
    },
    message: {
        type: String
    },
    date: {
        type: Date,
        required: true
    },
    isReminded: {
        type: Boolean,
        default: false,
        required: true
    },
}, {
    timestamps: true
});

module.exports = model('remind', schema);
