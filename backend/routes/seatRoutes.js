
const express = require("express");
const router = express.Router();

const {
    getSeatsByRoom,
    getSeatById,
    getSeatsByType
} = require("../controllers/seatController");

// Lấy ghế theo loại trong phòng
router.get("/room/:roomId/type/:seatType", getSeatsByType);

// Lấy tất cả ghế trong phòng
router.get("/room/:roomId", getSeatsByRoom);

// Xem chi tiết ghế
router.get("/:id", getSeatById);

module.exports = router;
