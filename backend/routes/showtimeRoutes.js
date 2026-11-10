
const express = require("express");
const router = express.Router();

const {
    getShowtimes,
    getShowtimeById,
    getShowtimesByMovie
} = require("../controllers/showtimeController");

// Lấy lịch chiếu theo phim
router.get("/movie/:movieId", getShowtimesByMovie);

// Lấy toàn bộ lịch chiếu và hỗ trợ lọc
router.get("/", getShowtimes);

// Xem chi tiết suất chiếu
router.get("/:id", getShowtimeById);

module.exports = router;
