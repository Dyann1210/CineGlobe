
const express = require("express");
const router = express.Router();

const {
    getMovies,
    getMovieById,
    getNowShowing,
    getComingSoon
} = require("../controllers/movieController");

// Lấy toàn bộ danh sách phim
router.get("/", getMovies);

// Lấy danh sách phim đang chiếu
router.get("/now-showing", getNowShowing);

// Lấy danh sách phim sắp chiếu
router.get("/coming-soon", getComingSoon);

// Lấy chi tiết phim theo ID
router.get("/:id", getMovieById);

module.exports = router;
