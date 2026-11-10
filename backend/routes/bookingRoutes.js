
const express = require("express");
const router = express.Router();

const {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking
} = require("../controllers/bookingController");

const authMiddleware = require("../middleware/authMiddleware");

// Tạo đơn đặt vé
router.post("/", authMiddleware, createBooking);

// Lấy lịch sử đặt vé của tôi
router.get("/my-bookings", authMiddleware, getMyBookings);

// Xem chi tiết đơn đặt vé
router.get("/:id", authMiddleware, getBookingById);

// Hủy đơn đặt vé
router.patch("/:id/cancel", authMiddleware, cancelBooking);

module.exports = router;
