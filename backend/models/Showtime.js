
const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema({
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
        required: true
    },

    cinema: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cinema",
        required: true
    },

    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },

    startTime: {
        type: Date,
        required: true
    },

    endTime: {
        type: Date,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["scheduled", "ongoing", "completed", "cancelled"],
        default: "scheduled"
    },

    availableSeats: {
        type: Number,
        default: 0,
        min: 0
    }

}, {
    timestamps: true
});

// Tìm suất chiếu theo phim, rạp và thời gian
showtimeSchema.index({
    movie: 1,
    cinema: 1,
    startTime: 1
});

module.exports = mongoose.model("Showtime", showtimeSchema);
