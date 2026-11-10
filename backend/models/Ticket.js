
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    ticketCode: {
        type: String,
        required: true,
        unique: true
    },

    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    showtime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Showtime",
        required: true
    },

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

    seat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
        required: true
    },

    seatNumber: {
        type: String,
        required: true
    },

    qrCode: {
        type: String,
        default: ""
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["valid", "used", "cancelled", "expired"],
        default: "valid"
    },

    checkedInAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

ticketSchema.index({
    booking: 1,
    seat: 1
});

module.exports = mongoose.model("Ticket", ticketSchema);
