
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    message: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: [
            "booking",
            "payment",
            "promotion",
            "system",
            "reminder"
        ],
        default: "system"
    },

    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    isRead: {
        type: Boolean,
        default: false
    },

    readAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// Tìm thông báo theo người dùng và thời gian
notificationSchema.index({ user: 1, createdAt: -1 });

// Lọc thông báo chưa đọc
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
