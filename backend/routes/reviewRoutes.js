const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getMovieReviews,
    getMyReview,
    submitReview
} = require("../controllers/reviewController");

// Công khai: xem đánh giá của phim
router.get("/movie/:movieId", getMovieReviews);

// Yêu cầu đăng nhập: xem đánh giá của bản thân
router.get("/movie/:movieId/my-review", authMiddleware, getMyReview);

// Yêu cầu đăng nhập: gửi hoặc cập nhật đánh giá
router.post("/movie/:movieId", authMiddleware, submitReview);

module.exports = router;
