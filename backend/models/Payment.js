
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
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

    transactionCode: {
        type: String,
        unique: true,
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ["cash", "momo", "vnpay", "zalopay", "banking"],
        default: "cash"
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["pending", "success", "failed", "refunded"],
        default: "pending"
    },

    paidAt: {
        type: Date,
        default: null
    },

    description: {
        type: String,
        default: ""
    },

    providerTransactionId: {
        type: String,
        default: ""
    }

}, {
    timestamps: true
});

paymentSchema.index({
    booking: 1,
    createdAt: -1
});

module.exports = mongoose.model("Payment", paymentSchema);
