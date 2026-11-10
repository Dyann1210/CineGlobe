const mongoose = require("mongoose");
const Review = require("../models/Review");
const Movie = require("../models/Movie");
const syncMovieRating = require("../utils/syncMovieRating");

// Tính điểm trung bình và số lượng đánh giá từ MongoDB
const getReviewSummary = async (movieId) => {
    return await syncMovieRating(movieId);
};

// GET /api/reviews/movie/:movieId
// Xem tất cả đánh giá của một bộ phim
const getMovieReviews = async (req, res) => {
    try {
        const { movieId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({
                success: false,
                message: "Mã phim không hợp lệ."
            });
        }

        const movieExists = await Movie.exists({ _id: movieId });

        if (!movieExists) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phim."
            });
        }

        const reviews = await Review.find({
            movie: movieId,
            isApproved: true
        })
            .populate("user", "fullName avatar")
            .sort({ createdAt: -1 })
            .lean();

        const summary = await getReviewSummary(movieId);

        return res.json({
            success: true,
            reviews,
            summary
        });
    } catch (error) {
        console.error("GET MOVIE REVIEWS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể tải đánh giá phim."
        });
    }
};

// GET /api/reviews/movie/:movieId/my-review
// Lấy đánh giá của tài khoản đang đăng nhập
const getMyReview = async (req, res) => {
    try {
        const { movieId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({
                success: false,
                message: "Mã phim không hợp lệ."
            });
        }

        const review = await Review.findOne({
            movie: movieId,
            user: req.user._id
        }).lean();

        return res.json({
            success: true,
            review: review || null
        });
    } catch (error) {
        console.error("GET MY REVIEW ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể tải đánh giá của bạn."
        });
    }
};

// POST /api/reviews/movie/:movieId
// Gửi đánh giá mới hoặc cập nhật đánh giá cũ
const submitReview = async (req, res) => {
    try {
        const { movieId } = req.params;
        const rating = Number(req.body.rating);
        const comment = String(req.body.comment || "").trim();

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({
                success: false,
                message: "Mã phim không hợp lệ."
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn số sao từ 1 đến 5."
            });
        }

        if (!comment || comment.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập bình luận ít nhất 3 ký tự."
            });
        }

        if (comment.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Bình luận không được vượt quá 1000 ký tự."
            });
        }

        const movieExists = await Movie.exists({ _id: movieId });

        if (!movieExists) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phim."
            });
        }

        let review = await Review.findOne({
            movie: movieId,
            user: req.user._id
        });

        if (review) {
            review.rating = rating;
            review.comment = comment;
            review.isEdited = true;
            review.isApproved = true;
            await review.save();
        } else {
            review = await Review.create({
                movie: movieId,
                user: req.user._id,
                rating,
                comment,
                isApproved: true,
                isEdited: false
            });
        }

        const savedReview = await Review.findById(review._id)
            .populate("user", "fullName avatar")
            .lean();

        const summary = await getReviewSummary(movieId);

        return res.status(200).json({
            success: true,
            message: "Đánh giá phim đã được lưu thành công!",
            review: savedReview,
            summary
        });
    } catch (error) {
        console.error("SUBMIT REVIEW ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Bạn đã đánh giá phim này. Vui lòng tải lại trang."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Không thể lưu đánh giá. Vui lòng thử lại."
        });
    }
};

module.exports = {
    getMovieReviews,
    getMyReview,
    submitReview
};
