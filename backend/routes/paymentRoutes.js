
const express = require("express");
const router = express.Router();

const {
    createPayment,
    confirmDemoPayment,
    getMyPayments
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");

// Tạo giao dịch thanh toán
router.post("/", authMiddleware, createPayment);

// Xác nhận thanh toán mô phỏng
router.post("/:id/demo-confirm", authMiddleware, confirmDemoPayment);

// Lấy lịch sử thanh toán
router.get("/my-payments", authMiddleware, getMyPayments);

module.exports = router;
