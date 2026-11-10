
const mongoose = require("mongoose");

const User = require("../models/User");
const Movie = require("../models/Movie");
const syncMovieRating = require("../utils/syncMovieRating");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Ticket = require("../models/Ticket");
const Cinema = require("../models/Cinema");
const Showtime = require("../models/Showtime");


// =====================================
// TAO SLUG PHIM TU DONG - CHONG TRUNG
// =====================================
const makeMovieSlug = (value) => {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "movie";
};

const generateUniqueMovieSlug = async (value) => {
    const baseSlug = makeMovieSlug(value);

    let slug = baseSlug;
    let counter = 2;

    while (await Movie.findOne({ slug }).select("_id").lean()) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
};
// =====================================
// DASHBOARD - THỐNG KÊ TỪ MONGODB
// =====================================

const getDashboard = async (req, res) => {
    try {
        const [
            totalUsers,
            totalMovies,
            nowShowing,
            comingSoon,
            totalBookings,
            pendingBookings,
            paidPayments,
            totalTickets,
            totalCinemas,
            totalShowtimes,
            recentBookings,
            recentUsers
        ] = await Promise.all([
            User.countDocuments(),
            Movie.countDocuments(),
            Movie.countDocuments({ status: "now_showing" }),
            Movie.countDocuments({ status: "coming_soon" }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: "pending" }),
            Payment.find({ status: "success" }).select("amount"),
            Ticket.countDocuments(),
            Cinema.countDocuments(),
            Showtime.countDocuments(),
            Booking.find()
                .populate("user", "fullName email")
                .populate("movie", "title poster")
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),
            User.find()
                .select("-password")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean()
        ]);

        const revenue = paidPayments.reduce(
            (total, payment) => total + Number(payment.amount || 0),
            0
        );

        return res.json({
            success: true,
            statistics: {
                totalUsers,
                totalMovies,
                nowShowing,
                comingSoon,
                totalBookings,
                pendingBookings,
                totalTickets,
                totalCinemas,
                totalShowtimes,
                revenue
            },
            recentBookings,
            recentUsers
        });

    } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể tải thống kê quản trị.",
            error: error.message
        });
    }
};

// =====================================
// QUẢN LÝ PHIM
// =====================================

// Lấy danh sách phim
const getAdminMovies = async (req, res) => {
    try {
        const { search, status } = req.query;

        const filter = {};

        if (search) {
            filter.title = {
                $regex: search,
                $options: "i"
            };
        }

        if (status) {
            filter.status = status;
        }

        let movies = await Movie.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Đồng bộ điểm đánh giá của các phim
        await Promise.all(
            movies.map((movie) => syncMovieRating(movie._id))
        );

        // Lấy lại dữ liệu mới nhất
        movies = await Movie.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            total: movies.length,
            movies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách phim.",
            error: error.message
        });
    }
};

// Thêm phim
const createMovie = async (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            poster,
            backdrop,
            trailer,
            genres,
            duration,
            releaseDate,
            language,
            ageRating,
            director,
            cast,
            status,
            rating,
            isFeatured
        } = req.body;

        if (!title || !duration) {
            return res.status(400).json({
                success: false,
                message: "Tên phim và thời lượng là bắt buộc."
            });
        }

        const parsedDuration = Number(duration);

        if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
            return res.status(400).json({
                success: false,
                message: "Thời lượng phim phải lớn hơn 0."
            });
        }

        const movie = await Movie.create({
            title: title.trim(),
            slug: await generateUniqueMovieSlug(slug || title),
            description: description || "",
            poster: poster || "",
            backdrop: backdrop || "",
            trailer: trailer || "",
            genres: Array.isArray(genres) ? genres : [],
            duration: parsedDuration,
            releaseDate: releaseDate || undefined,
            language: language || "Tiếng Việt",
            ageRating: ageRating || "P",
            director: director || "",
            cast: Array.isArray(cast) ? cast : [],
            status: status || "coming_soon",
            rating: rating === undefined ? 0 : Number(rating),
            isFeatured: Boolean(isFeatured)
        });

        return res.status(201).json({
            success: true,
            message: "Thêm phim thành công.",
            movie
        });

    } catch (error) {
        console.error("CREATE MOVIE ERROR:", error);

        return res.status(400).json({
            success: false,
            message: "Không thể thêm phim.",
            error: error.message
        });
    }
};

// Cập nhật phim
const updateMovie = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "ID phim không hợp lệ."
            });
        }

        const allowedFields = [
            "title",
            "slug",
            "description",
            "poster",
            "backdrop",
            "trailer",
            "genres",
            "duration",
            "releaseDate",
            "language",
            "ageRating",
            "director",
            "cast",
            "status",
            "rating",
            "isFeatured"
        ];

        const updateData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (updateData.title !== undefined) {
            updateData.title = String(updateData.title).trim();

            if (!updateData.title) {
                return res.status(400).json({
                    success: false,
                    message: "Tên phim không được để trống."
                });
            }
        }

        if (updateData.duration !== undefined) {
            updateData.duration = Number(updateData.duration);

            if (
                !Number.isFinite(updateData.duration) ||
                updateData.duration <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Thời lượng không hợp lệ."
                });
            }
        }

        if (
            updateData.rating !== undefined &&
            (
                !Number.isFinite(Number(updateData.rating)) ||
                Number(updateData.rating) < 0 ||
                Number(updateData.rating) > 10
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Điểm đánh giá phải từ 0 đến 10."
            });
        }

        const currentMovie = await Movie.findById(req.params.id)
            .select("reviewCount");

        // Nếu đã có đánh giá, điểm phim do hệ thống tự tính.
        if (currentMovie && currentMovie.reviewCount > 0) {
            delete updateData.rating;
        }

        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phim."
            });
        }

        return res.json({
            success: true,
            message: "Cập nhật phim thành công.",
            movie
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Không thể cập nhật phim.",
            error: error.message
        });
    }
};

// Xóa phim
const deleteMovie = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "ID phim không hợp lệ."
            });
        }

        // Không xóa phim đã có lịch sử đặt vé.
        const hasBookings = await Booking.exists({
            movie: req.params.id
        });

        if (hasBookings) {
            return res.status(409).json({
                success: false,
                message: "Phim đã có lịch sử đặt vé. Hãy chuyển trạng thái sang 'ended' thay vì xóa."
            });
        }

        const movie = await Movie.findByIdAndDelete(req.params.id);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phim."
            });
        }

        return res.json({
            success: true,
            message: "Xóa phim thành công."
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể xóa phim.",
            error: error.message
        });
    }
};

// =====================================
// QUẢN LÝ NGƯỜI DÙNG
// =====================================

// Lấy danh sách người dùng
const getAdminUsers = async (req, res) => {
    try {
        const { search, role } = req.query;

        const filter = {};

        if (role && ["customer", "admin"].includes(role)) {
            filter.role = role;
        }

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            total: users.length,
            users
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách người dùng.",
            error: error.message
        });
    }
};

// Cập nhật thông tin người dùng và vai trò
const updateAdminUser = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "ID người dùng không hợp lệ."
            });
        }

        if (String(req.user._id) === req.params.id) {
            return res.status(400).json({
                success: false,
                message: "Không thể tự thay đổi tài khoản quản trị của mình tại đây."
            });
        }

        const allowedFields = ["fullName", "phone", "role"];
        const updateData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (
            updateData.role !== undefined &&
            !["customer", "admin"].includes(updateData.role)
        ) {
            return res.status(400).json({
                success: false,
                message: "Vai trò không hợp lệ."
            });
        }

        if (
            updateData.fullName !== undefined &&
            !String(updateData.fullName).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Họ tên không được để trống."
            });
        }

        if (updateData.fullName !== undefined) {
            updateData.fullName = String(updateData.fullName).trim();
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng."
            });
        }

        return res.json({
            success: true,
            message: "Cập nhật người dùng thành công.",
            user
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Không thể cập nhật người dùng.",
            error: error.message
        });
    }
};

// Xóa người dùng
const deleteAdminUser = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "ID người dùng không hợp lệ."
            });
        }

        if (String(req.user._id) === req.params.id) {
            return res.status(400).json({
                success: false,
                message: "Không thể tự xóa tài khoản đang đăng nhập."
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng."
            });
        }

        const hasBookings = await Booking.exists({
            user: user._id
        });

        if (hasBookings) {
            return res.status(409).json({
                success: false,
                message: "Người dùng đã có lịch sử đặt vé. Không thể xóa để bảo toàn dữ liệu."
            });
        }

        await User.findByIdAndDelete(user._id);

        return res.json({
            success: true,
            message: "Xóa người dùng thành công."
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể xóa người dùng.",
            error: error.message
        });
    }
};

module.exports = {
    getDashboard,
    getAdminMovies,
    createMovie,
    updateMovie,
    deleteMovie,
    getAdminUsers,
    updateAdminUser,
    deleteAdminUser
};

