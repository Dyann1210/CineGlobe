
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
        required: true
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    comment: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000
    },

    isApproved: {
        type: Boolean,
        default: true
    },

    isEdited: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

// Mỗi khách hàng chỉ được đánh giá một lần cho mỗi phim
reviewSchema.index(
    { user: 1, movie: 1 },
    { unique: true }
);

reviewSchema.index({ movie: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
