
const express = require("express");
const router = express.Router();

const {
    getCinemas,
    getCinemaById,
    getCinemaCities
} = require("../controllers/cinemaController");

// Lấy danh sách thành phố có rạp
router.get("/cities", getCinemaCities);

// Lấy danh sách rạp
router.get("/", getCinemas);

// Xem chi tiết rạp
router.get("/:id", getCinemaById);

module.exports = router;
