
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        unique: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    poster: {
        type: String,
        default: ""
    },

    backdrop: {
        type: String,
        default: ""
    },

    trailer: {
        type: String,
        default: ""
    },

    genres: [{
        type: String
    }],

    duration: {
        type: Number,
        required: true
    },

    releaseDate: {
        type: Date
    },

    language: {
        type: String,
        default: "Tiếng Việt"
    },

    ageRating: {
        type: String,
        default: "P"
    },

    director: {
        type: String,
        default: ""
    },

    cast: [{
        type: String
    }],

    status: {
        type: String,
        enum: ["now_showing", "coming_soon", "ended"],
        default: "coming_soon"
    },

    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },

    reviewCount: {
        type: Number,
        default: 0
    },

    isFeatured: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Movie", movieSchema);
