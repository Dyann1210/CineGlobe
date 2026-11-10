
const mongoose = require("mongoose");

const cinemaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        unique: true,
        trim: true
    },

    address: {
        type: String,
        required: true
    },

    city: {
        type: String,
        required: true
    },

    district: {
        type: String,
        default: ""
    },

    description: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""
    },

    phone: {
        type: String,
        default: ""
    },

    facilities: [{
        type: String
    }],

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Cinema", cinemaSchema);
