const mongoose = require("mongoose");

const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const Cinema = require("../models/Cinema");
const Room = require("../models/Room");
const Booking = require("../models/Booking");

// Lấy toàn bộ suất chiếu dành cho Admin
const getAdminShowtimes = async (req, res) => {
    try {
        const { status, movieId, cinemaId, date } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (movieId && mongoose.isValidObjectId(movieId)) {
            filter.movie = movieId;
        }
        if (cinemaId && mongoose.isValidObjectId(cinemaId)) {
            filter.cinema = cinemaId;
        }

        if (date) {
            const start = new Date(`${date}T00:00:00`);
            const end = new Date(`${date}T23:59:59.999`);

            if (Number.isNaN(start.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Ngày lọc không hợp lệ."
                });
            }

            filter.startTime = { $gte: start, $lte: end };
        }

        const showtimes = await Showtime.find(filter)
            .populate("movie", "title poster duration ageRating")
            .populate("cinema", "name address city")
            .populate("room", "name roomType totalSeats")
            .sort({ startTime: -1 });

        // Tính ghế đã đặt/đang giữ theo dữ liệu Booking thực tế.
        const now = new Date();
        const showtimeIds = showtimes.map(item => item._id);

        if (showtimeIds.length > 0) {
            const bookings = await Booking.find({
                showtime: { $in: showtimeIds },
                $or: [
                    { status: "confirmed" },
                    {
                        status: "pending",
                        expiresAt: { $gt: now }
                    }
                ]
            }).select("showtime seats");

            // Mỗi suất chiếu có một Set để tránh đếm trùng ghế.
            const bookedSeatsByShowtime = new Map();

            for (const booking of bookings) {
                const showtimeId = String(booking.showtime);

                if (!bookedSeatsByShowtime.has(showtimeId)) {
                    bookedSeatsByShowtime.set(showtimeId, new Set());
                }

                const seatSet = bookedSeatsByShowtime.get(showtimeId);

                for (const item of booking.seats || []) {
                    const seatId = item.seat?._id || item.seat;

                    if (seatId) {
                        seatSet.add(String(seatId));
                    }
                }
            }

            // Ghi đè availableSeats trong kết quả trả về,
            // không thay đổi dữ liệu gốc của Showtime trong database.
            for (const showtime of showtimes) {
                const totalSeats = Number(
                    showtime.room?.totalSeats ??
                    showtime.availableSeats ??
                    0
                );

                const seatSet = bookedSeatsByShowtime.get(
                    String(showtime._id)
                );

                const bookedCount = seatSet ? seatSet.size : 0;

                showtime.availableSeats = Math.max(
                    0,
                    totalSeats - bookedCount
                );
            }
        }

        return res.json({
            success: true,
            total: showtimes.length,
            showtimes
        });
    } catch (error) {
        console.error("Get admin showtimes error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể tải danh sách suất chiếu.",
            error: error.message
        });
    }
};

// Tạo suất chiếu mới
const createAdminShowtime = async (req, res) => {
    try {
        const { movieId, cinemaId, roomId, startTime, price } = req.body;

        if (
            !movieId || !cinemaId || !roomId ||
            !startTime || price === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ phim, rạp, phòng, giờ chiếu và giá vé."
            });
        }

        if (
            !mongoose.isValidObjectId(movieId) ||
            !mongoose.isValidObjectId(cinemaId) ||
            !mongoose.isValidObjectId(roomId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Thông tin phim, rạp hoặc phòng không hợp lệ."
            });
        }

        const start = new Date(startTime);
        const ticketPrice = Number(price);

        if (Number.isNaN(start.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Thời gian bắt đầu không hợp lệ."
            });
        }

        if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Giá vé phải là số không âm."
            });
        }

        const [movie, cinema, room] = await Promise.all([
            Movie.findById(movieId),
            Cinema.findById(cinemaId),
            Room.findById(roomId)
        ]);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phim."
            });
        }

        if (!cinema || !cinema.isActive) {
            return res.status(400).json({
                success: false,
                message: "Rạp không tồn tại hoặc đang ngừng hoạt động."
            });
        }

        if (!room || !room.isActive) {
            return res.status(400).json({
                success: false,
                message: "Phòng không tồn tại hoặc đang ngừng hoạt động."
            });
        }

        if (String(room.cinema) !== String(cinemaId)) {
            return res.status(400).json({
                success: false,
                message: "Phòng chiếu không thuộc rạp đã chọn."
            });
        }

        const duration = Number(movie.duration);

        if (!Number.isFinite(duration) || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: "Phim chưa có thời lượng hợp lệ."
            });
        }

        const end = new Date(start.getTime() + duration * 60000);

        // Kiểm tra lịch chiếu trùng trong cùng phòng
        const conflict = await Showtime.findOne({
            room: roomId,
            status: { $ne: "cancelled" },
            startTime: { $lt: end },
            endTime: { $gt: start }
        });

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "Phòng đã có suất chiếu trùng thời gian."
            });
        }

        const date = new Date(start);
        date.setHours(0, 0, 0, 0);

        const showtime = await Showtime.create({
            movie: movieId,
            cinema: cinemaId,
            room: roomId,
            startTime: start,
            endTime: end,
            date,
            price: ticketPrice,
            status: "scheduled",
            availableSeats: room.totalSeats
        });

        const result = await Showtime.findById(showtime._id)
            .populate("movie", "title poster duration")
            .populate("cinema", "name address city")
            .populate("room", "name roomType totalSeats");

        return res.status(201).json({
            success: true,
            message: "Tạo suất chiếu thành công.",
            showtime: result
        });
    } catch (error) {
        console.error("Create admin showtime error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể tạo suất chiếu.",
            error: error.message
        });
    }
};

// Cập nhật suất chiếu
const updateAdminShowtime = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID suất chiếu không hợp lệ."
            });
        }

        const showtime = await Showtime.findById(id);

        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy suất chiếu."
            });
        }

        const { movieId, cinemaId, roomId, startTime, price, status } = req.body;

        const hasBookings = await Booking.exists({ showtime: id });

        const scheduleChanged =
            (movieId && String(movieId) !== String(showtime.movie)) ||
            (cinemaId && String(cinemaId) !== String(showtime.cinema)) ||
            (roomId && String(roomId) !== String(showtime.room)) ||
            (startTime && new Date(startTime).getTime() !== showtime.startTime.getTime()) ||
            (price !== undefined && Number(price) !== showtime.price);

        if (hasBookings && scheduleChanged) {
            return res.status(400).json({
                success: false,
                message: "Suất chiếu đã có đơn đặt vé. Không thể thay đổi phim, rạp, phòng, giờ chiếu hoặc giá vé."
            });
        }

        if (hasBookings && status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Suất chiếu đã có đơn đặt vé. Không thể hủy trực tiếp; cần xử lý các đơn đặt vé trước."
            });
        }

        const nextMovieId = movieId || showtime.movie;
        const nextCinemaId = cinemaId || showtime.cinema;
        const nextRoomId = roomId || showtime.room;
        const nextStart = startTime ? new Date(startTime) : showtime.startTime;
        const nextPrice = price !== undefined ? Number(price) : showtime.price;

        if (
            !mongoose.isValidObjectId(nextMovieId) ||
            !mongoose.isValidObjectId(nextCinemaId) ||
            !mongoose.isValidObjectId(nextRoomId) ||
            Number.isNaN(nextStart.getTime()) ||
            !Number.isFinite(nextPrice) ||
            nextPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu cập nhật không hợp lệ."
            });
        }

        const [movie, cinema, room] = await Promise.all([
            Movie.findById(nextMovieId),
            Cinema.findById(nextCinemaId),
            Room.findById(nextRoomId)
        ]);

        if (!movie || !cinema || !room || !cinema.isActive || !room.isActive) {
            return res.status(400).json({
                success: false,
                message: "Phim, rạp hoặc phòng không hợp lệ hay đang ngừng hoạt động."
            });
        }

        if (String(room.cinema) !== String(nextCinemaId)) {
            return res.status(400).json({
                success: false,
                message: "Phòng chiếu không thuộc rạp đã chọn."
            });
        }

        const duration = Number(movie.duration);

        if (!Number.isFinite(duration) || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: "Thời lượng phim không hợp lệ."
            });
        }

        const nextEnd = new Date(nextStart.getTime() + duration * 60000);

        const conflict = await Showtime.findOne({
            _id: { $ne: id },
            room: nextRoomId,
            status: { $ne: "cancelled" },
            startTime: { $lt: nextEnd },
            endTime: { $gt: nextStart }
        });

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "Phòng đã có suất chiếu khác trùng thời gian."
            });
        }

        const allowedStatuses = [
            "scheduled",
            "ongoing",
            "completed",
            "cancelled"
        ];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái suất chiếu không hợp lệ."
            });
        }

        const date = new Date(nextStart);
        date.setHours(0, 0, 0, 0);

        showtime.movie = nextMovieId;
        showtime.cinema = nextCinemaId;
        showtime.room = nextRoomId;
        showtime.startTime = nextStart;
        showtime.endTime = nextEnd;
        showtime.date = date;
        showtime.price = nextPrice;
        if (!hasBookings) {
    showtime.availableSeats = room.totalSeats;
}

        if (status) showtime.status = status;

        await showtime.save();

        const result = await Showtime.findById(id)
            .populate("movie", "title poster duration")
            .populate("cinema", "name address city")
            .populate("room", "name roomType totalSeats");

        return res.json({
            success: true,
            message: "Cập nhật suất chiếu thành công.",
            showtime: result
        });
    } catch (error) {
        console.error("Update admin showtime error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật suất chiếu.",
            error: error.message
        });
    }
};

// Xóa suất chiếu
const deleteAdminShowtime = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID suất chiếu không hợp lệ."
            });
        }

        const showtime = await Showtime.findById(id);

        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy suất chiếu."
            });
        }

        const bookingCount = await Booking.countDocuments({
            showtime: id
        });

        if (bookingCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa suất chiếu đã có đơn đặt vé."
            });
        }

        await Showtime.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Xóa suất chiếu thành công."
        });
    } catch (error) {
        console.error("Delete admin showtime error:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xóa suất chiếu.",
            error: error.message
        });
    }
};

module.exports = {
    getAdminShowtimes,
    createAdminShowtime,
    updateAdminShowtime,
    deleteAdminShowtime
};