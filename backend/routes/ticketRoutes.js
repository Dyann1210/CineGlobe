
const express = require("express");
const router = express.Router();

const {
    getMyTickets,
    getTicketById
} = require("../controllers/ticketController");

const authMiddleware = require("../middleware/authMiddleware");

// LẤY DANH SÁCH VÉ CỦA TÔI
router.get("/my-tickets", authMiddleware, getMyTickets);

// LẤY CHI TIẾT VÉ
router.get("/:id", authMiddleware, getTicketById);

module.exports = router;
