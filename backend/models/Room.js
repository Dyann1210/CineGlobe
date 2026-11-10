
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    cinema: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cinema",
        required: true
    },

    roomType: {
        type: String,
        enum: ["standard", "vip", "couple", "imax"],
        default: "standard"
    },

    totalRows: {
        type: Number,
        required: true,
        min: 1
    },

    seatsPerRow: {
        type: Number,
        required: true,
        min: 1
    },

    totalSeats: {
        type: Number,
        default: 0
    },

    screenType: {
        type: String,
        default: "2D"
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// Tự động tính tổng số ghế
roomSchema.pre("validate", function () {
    this.totalSeats = this.totalRows * this.seatsPerRow;
});

module.exports = mongoose.model("Room", roomSchema);
