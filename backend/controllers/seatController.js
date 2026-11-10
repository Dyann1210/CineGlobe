const Seat = require("../models/Seat");
const Room = require("../models/Room");
const Booking = require("../models/Booking");

// LẤY SƠ ĐỒ GHẾ VÀ TRẠNG THÁI GHẾ THEO SUẤT CHIẾU
const getSeatsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { showtimeId } = req.query;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phòng chiếu."
            });
        }

        const seats = await Seat.find({
            room: roomId,
            isActive: true
        }).sort({ row: 1, number: 1 });

        let bookedSeatIds = [];

        if (showtimeId) {
            const now = new Date();

            // Chỉ ghế thuộc đơn đã thanh toán/xác nhận
            // hoặc đơn đang giữ ghế và chưa hết hạn mới bị khóa.
            const bookings = await Booking.find({
                showtime: showtimeId,
                $or: [
                    { status: "confirmed" },
                    {
                        status: "pending",
                        expiresAt: { $gt: now }
                    }
                ]
            }).select("seats");

            bookedSeatIds = [
                ...new Set(
                    bookings.flatMap((booking) =>
                        (booking.seats || []).map((item) =>
                            String(item.seat?._id || item.seat)
                        )
                    )
                )
            ];
        }

        return res.status(200).json({
            success: true,
            room,
            total: seats.length,
            seats,
            bookedSeatIds
        });

    } catch (error) {
        console.error("getSeatsByRoom error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách ghế.",
            error: error.message
        });
    }
};

// LẤY CHI TIẾT MỘT GHẾ
const getSeatById = async (req, res) => {
    try {
        const seat = await Seat.findById(req.params.id)
            .populate("room", "name roomType");

        if (!seat) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy ghế."
            });
        }

        return res.status(200).json({
            success: true,
            seat
        });

    } catch (error) {
        console.error("getSeatById error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin ghế.",
            error: error.message
        });
    }
};

// LẤY GHẾ THEO LOẠI
const getSeatsByType = async (req, res) => {
    try {
        const { roomId, seatType } = req.params;

        const allowedTypes = ["standard", "vip", "couple"];

        if (!allowedTypes.includes(seatType)) {
            return res.status(400).json({
                success: false,
                message: "Loại ghế không hợp lệ."
            });
        }

        const seats = await Seat.find({
            room: roomId,
            seatType,
            isActive: true
        }).sort({ row: 1, number: 1 });

        return res.status(200).json({
            success: true,
            total: seats.length,
            seats
        });

    } catch (error) {
        console.error("getSeatsByType error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy ghế theo loại.",
            error: error.message
        });
    }
};

module.exports = {
    getSeatsByRoom,
    getSeatById,
    getSeatsByType
};