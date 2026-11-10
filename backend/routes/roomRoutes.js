
const express = require("express");
const router = express.Router();

const {
    getRooms,
    getRoomById,
    getRoomsByCinema
} = require("../controllers/roomController");

// Lấy phòng chiếu theo rạp
router.get("/cinema/:cinemaId", getRoomsByCinema);

// Lấy danh sách phòng chiếu và hỗ trợ lọc
router.get("/", getRooms);

// Xem chi tiết phòng chiếu
router.get("/:id", getRoomById);

module.exports = router;
