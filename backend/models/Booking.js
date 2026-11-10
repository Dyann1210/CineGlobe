
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    bookingCode: {
        type: String,
        unique: true,
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

    seats: [{
        seat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seat",
            required: true
        },

        seatNumber: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    totalSeats: {
        type: Number,
        required: true,
        min: 1
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion",
        default: null
    },

    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "expired"],
        default: "pending"
    },

    expiresAt: {
        type: Date
    },

    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "refunded", "failed"],
        default: "unpaid"
    }

}, {
    timestamps: true
});

// Tìm lịch sử đặt vé của người dùng
bookingSchema.index({
    user: 1,
    createdAt: -1
});

module.exports = mongoose.model("Booking", bookingSchema);
