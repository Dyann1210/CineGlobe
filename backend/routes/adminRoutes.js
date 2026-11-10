const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { checkInTicket } = require("../controllers/ticketController");
const adminMiddleware = require("../middleware/adminMiddleware");

// Controller quản trị chung
const {
    getDashboard,
    getAdminMovies,
    createMovie,
    updateMovie,
    deleteMovie,
    getAdminUsers,
    updateAdminUser,
    deleteAdminUser
} = require("../controllers/adminController");

// Controller quản lý rạp và phòng
const {
    getAdminCinemas,
    createAdminCinema,
    updateAdminCinema,
    deleteAdminCinema,
    getAdminRooms,
    createAdminRoom,
    updateAdminRoom,
    deleteAdminRoom
} = require("../controllers/adminCinemaController");

// Controller quản lý suất chiếu
const {
    getAdminShowtimes,
    createAdminShowtime,
    updateAdminShowtime,
    deleteAdminShowtime
} = require("../controllers/adminShowtimeController");

// Controller quản lý thanh toán
const {
    getAdminPayments
} = require("../controllers/adminPaymentController");
// Tất cả API bên dưới yêu cầu đăng nhập và quyền Admin
router.use(authMiddleware, adminMiddleware);

// ===============================
// DASHBOARD
// ===============================
router.get("/dashboard", getDashboard);

// ===============================
// QUẢN LÝ PHIM
// ===============================
router.get("/movies", getAdminMovies);
router.post("/movies", createMovie);
router.put("/movies/:id", updateMovie);
router.delete("/movies/:id", deleteMovie);

// ===============================
// QUẢN LÝ NGƯỜI DÙNG
// ===============================
router.get("/users", getAdminUsers);
router.put("/users/:id", updateAdminUser);
router.delete("/users/:id", deleteAdminUser);

// ===============================
// QUẢN LÝ RẠP
// ===============================
router.get("/cinemas", getAdminCinemas);
router.post("/cinemas", createAdminCinema);
router.put("/cinemas/:id", updateAdminCinema);
router.delete("/cinemas/:id", deleteAdminCinema);

// ===============================
// QUẢN LÝ PHÒNG CHIẾU
// ===============================
router.get("/rooms", getAdminRooms);
router.post("/rooms", createAdminRoom);
router.put("/rooms/:id", updateAdminRoom);
router.delete("/rooms/:id", deleteAdminRoom);

// ===============================
// QUẢN LÝ SUẤT CHIẾU
// ===============================
router.get("/showtimes", getAdminShowtimes);
router.post("/showtimes", createAdminShowtime);
router.put("/showtimes/:id", updateAdminShowtime);
router.delete("/showtimes/:id", deleteAdminShowtime);

// ===============================
// QUẢN LÝ THANH TOÁN
// ===============================
router.get("/payments", getAdminPayments);

// XÁC NHẬN VÉ QR - ĐÃ ĐƯỢC BẢO VỆ BỞI AUTH VÀ ADMIN MIDDLEWARE
router.post("/tickets/check-in", checkInTicket);

module.exports = router;
