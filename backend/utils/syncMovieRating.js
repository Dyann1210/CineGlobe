const mongoose = require("mongoose");
const Review = require("../models/Review");
const Movie = require("../models/Movie");

// Tính điểm trung bình và đồng bộ sang Movie
const syncMovieRating = async (movieId) => {
    const result = await Review.aggregate([
        {
            $match: {
                movie: new mongoose.Types.ObjectId(movieId),
                isApproved: true
            }
        },
        {
            $group: {
                _id: "$movie",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    const averageRating = result.length
        ? Math.round(result[0].averageRating * 10) / 10
        : 0;

    const totalReviews = result.length
        ? result[0].totalReviews
        : 0;

    const updateData = {
        reviewCount: totalReviews
    };

    // Chỉ tự động cập nhật điểm khi đã có đánh giá.
    // Nếu chưa có đánh giá thì giữ điểm Admin đã nhập.
    if (totalReviews > 0) {
        updateData.rating = Math.round(averageRating * 2 * 10) / 10;
    }

    await Movie.findByIdAndUpdate(movieId, updateData, {
        runValidators: true
    });

    return {
        averageRating,
        totalReviews
    };
};

module.exports = syncMovieRating;