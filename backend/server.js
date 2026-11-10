
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const cinemaRoutes = require("./routes/cinemaRoutes");
const showtimeRoutes = require("./routes/showtimeRoutes");
const roomRoutes = require("./routes/roomRoutes");
const seatRoutes = require("./routes/seatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Models và xác thực thành viên
const User = require("./models/User");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// =====================================
// CORS
// =====================================

const corsOptions = {
    origin: function (origin, callback) {
        if (
            !origin ||
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
            return callback(null, true);
        }

        return callback(new Error("Origin không được phép: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================
// API TRANG CHỦ
// =====================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CineGlobe API is running!",
        database: "MongoDB Atlas"
    });
});

// =====================================
// API KIỂM TRA SERVER
// =====================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CineGlobe Backend hoạt động",
        database:
            mongoose.connection.readyState === 1
                ? "Connected"
                : "Disconnected"
    });
});

// =====================================
// API ĐĂNG NHẬP / ĐĂNG KÝ
// =====================================

app.use("/api/auth", authRoutes);

// =====================================
// API PHIM
// =====================================

app.use("/api/movies", movieRoutes);
app.use("/api/reviews", reviewRoutes);

// =====================================
// API RẠP
// =====================================

app.use("/api/cinemas", cinemaRoutes);

// =====================================
// API SUẤT CHIẾU
// =====================================

app.use("/api/showtimes", showtimeRoutes);

// =====================================
// API PHÒNG
// =====================================

app.use("/api/rooms", roomRoutes);

// =====================================
// API GHẾ
// =====================================

app.use("/api/seats", seatRoutes);

// =====================================
// API ĐẶT VÉ
// =====================================

app.use("/api/bookings", bookingRoutes);

// =====================================
// API THANH TOÁN
// =====================================

app.use("/api/payments", paymentRoutes);
app.use("/api/promotions", promotionRoutes);

// =====================================
// API VÉ CỦA TÔI
// =====================================

app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
// =====================================
// ADMIN API - QUAN TRI HE THONG
// =====================================

app.use("/api/admin", adminRoutes);
// =====================================
// HÀM TÍNH HẠNG THÀNH VIÊN
// =====================================

const getMembershipLevel = (points) => {
    if (points >= 10000) {
        return {
            name: "Platinum",
            label: "Thành viên Kim Cương",
            nextLevel: null,
            pointsToNextLevel: 0
        };
    }

    if (points >= 5000) {
        return {
            name: "Gold",
            label: "Thành viên Vàng",
            nextLevel: "Platinum",
            pointsToNextLevel: 10000 - points
        };
    }

    if (points >= 2000) {
        return {
            name: "Silver",
            label: "Thành viên Bạc",
            nextLevel: "Gold",
            pointsToNextLevel: 5000 - points
        };
    }

    return {
        name: "Bronze",
        label: "Thành viên Đồng",
        nextLevel: "Silver",
        pointsToNextLevel: 2000 - points
    };
};

// =====================================
// HÀM TẠO HUY HIỆU TỪ DỮ LIỆU THỰC
// =====================================

const getMemberBadges = (bookingCount, ticketCount, totalSpent) => {
    return [
        {
            id: "first-booking",
            name: "Tân Binh",
            description: "Hoàn thành giao dịch đặt vé đầu tiên",
            icon: "ticket",
            unlocked: bookingCount >= 1
        },
        {
            id: "movie-lover",
            name: "Mê Điện Ảnh",
            description: "Hoàn thành ít nhất 5 lần đặt vé",
            icon: "clapperboard",
            unlocked: bookingCount >= 5
        },
        {
            id: "cinema-fan",
            name: "Fan Cứng",
            description: "Hoàn thành ít nhất 10 lần đặt vé",
            icon: "star",
            unlocked: bookingCount >= 10
        },
        {
            id: "ticket-collector",
            name: "Sưu Tầm Vé",
            description: "Sở hữu ít nhất 20 vé đã thanh toán",
            icon: "award",
            unlocked: ticketCount >= 20
        },
        {
            id: "vip-spender",
            name: "Khách Hàng VIP",
            description: "Tổng chi tiêu đạt 1.000.000 VNĐ",
            icon: "crown",
            unlocked: totalSpent >= 1000000
        }
    ];
};

// =====================================
// API HỒ SƠ THÀNH VIÊN
// GET /api/members/me
// =====================================

app.get("/api/members/me", authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        // Chỉ lấy giao dịch thành công của tài khoản hiện tại
        const successfulPayments = await Payment.find({
            user: userId,
            status: "success"
        }).sort({ paidAt: -1 });

        const totalSpent = successfulPayments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
        );

        // Mỗi 10.000 VNĐ chi tiêu được 1 điểm
        const points = Math.floor(totalSpent / 10000);

        // Lấy các đơn đã thanh toán thành công
        const bookings = await Booking.find({
            user: userId,
            paymentStatus: "paid",
            status: "confirmed"
        })
            .populate("movie", "title poster")
            .populate("cinema", "name")
            .populate("showtime", "startTime")
            .sort({ createdAt: -1 });

        const bookingCount = bookings.length;

        const ticketCount = bookings.reduce(
            (sum, booking) => sum + Number(booking.totalSeats || 0),
            0
        );

        const membership = getMembershipLevel(points);

        const badges = getMemberBadges(
            bookingCount,
            ticketCount,
            totalSpent
        );

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy hồ sơ thành viên thành công.",

            profile: {
                id: user._id,
                memberCode: "CG" + String(user._id).slice(-8).toUpperCase(),
                fullName: user.fullName,
                email: user.email,
                phone: user.phone || "",
                avatar: user.avatar || "",
                role: user.role,
                joinedAt: user.createdAt
            },

            membership: {
                ...membership,
                points
            },

            statistics: {
                totalSpent,
                points,
                bookingCount,
                ticketCount,
                unlockedBadges: badges.filter(
                    badge => badge.unlocked
                ).length,
                totalBadges: badges.length
            },

            badges,

            recentBookings: bookings.slice(0, 10).map(booking => ({
                id: booking._id,
                bookingCode: booking.bookingCode,
                movie: booking.movie?.title || "Phim",
                poster: booking.movie?.poster || "",
                cinema: booking.cinema?.name || "",
                showtime: booking.showtime?.startTime || null,
                seats: (booking.seats || []).map(
                    seat => seat.seatNumber
                ),
                totalSeats: booking.totalSeats,
                totalAmount: booking.finalAmount,
                status: booking.status,
                createdAt: booking.createdAt
            }))
        });

    } catch (error) {
        console.error("GET MEMBER PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy hồ sơ thành viên.",
            error: error.message
        });
    }
});

// =====================================
// API CẬP NHẬT HỒ SƠ THÀNH VIÊN
// PATCH /api/members/me
// =====================================

app.patch("/api/members/me", authMiddleware, async (req, res) => {
    try {
        const { fullName, phone, avatar } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản."
            });
        }

        if (fullName !== undefined) {
            if (!String(fullName).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Họ tên không được để trống."
                });
            }

            user.fullName = String(fullName).trim();
        }

        if (phone !== undefined) {
            user.phone = String(phone).trim();
        }

        if (avatar !== undefined) {
            user.avatar = String(avatar).trim();
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Cập nhật hồ sơ thành công.",
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role
            }
        });

    } catch (error) {
        console.error("UPDATE MEMBER PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật hồ sơ.",
            error: error.message
        });
    }
});

// =====================================
// XỬ LÝ LỖI
// =====================================

app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.message);

    res.status(500).json({
        success: false,
        message: err.message || "Lỗi máy chủ."
    });
});

// =====================================
// KHỞI ĐỘNG SERVER
// =====================================

const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log("=================================");
            console.log("CINEGLOBE BACKEND RUNNING");
            console.log(`URL: http://localhost:${PORT}`);
            console.log("DATABASE: MongoDB Atlas");
            console.log("MEMBER PROFILE API: ENABLED");
            console.log("CORS: Localhost - All Ports");
            console.log("=================================");
        });

    } catch (error) {
        console.error("KHÔNG THỂ KHỞI ĐỘNG SERVER:", error);
        process.exit(1);
    }
};

startServer();


