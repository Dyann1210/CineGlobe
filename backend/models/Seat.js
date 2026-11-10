
const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },

    seatNumber: {
        type: String,
        required: true,
        trim: true
    },

    row: {
        type: String,
        required: true
    },

    number: {
        type: Number,
        required: true
    },

    seatType: {
        type: String,
        enum: ["standard", "vip", "couple"],
        default: "standard"
    },

    price: {
        type: Number,
        default: 0,
        min: 0
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// Mỗi phòng không được có hai ghế trùng số
seatSchema.index(
    { room: 1, seatNumber: 1 },
    { unique: true }
);

module.exports = mongoose.model("Seat", seatSchema);
