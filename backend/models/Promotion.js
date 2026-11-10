const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    description: {
        type: String,
        default: "",
        trim: true
    },

    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true
    },

    discountValue: {
        type: Number,
        required: true,
        min: 0
    },

    maxDiscount: {
        type: Number,
        default: 0,
        min: 0
    },

    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    usageLimit: {
        type: Number,
        default: 0,
        min: 0
    },

    usageCount: {
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


promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Promotion", promotionSchema);