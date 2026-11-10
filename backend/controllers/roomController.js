
const Room = require("../models/Room");

// LẤY DANH SÁCH PHÒNG CHIẾU
const getRooms = async (req, res) => {
    try {
        const { cinemaId, roomType } = req.query;

        const filter = {
            isActive: true
        };

        if (cinemaId) {
            filter.cinema = cinemaId;
        }

        if (roomType) {
            filter.roomType = roomType;
        }

        const rooms = await Room.find(filter)
            .populate("cinema", "name address city")
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            total: rooms.length,
            rooms
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách phòng chiếu.",
            error: error.message
        });
    }
};

// LẤY CHI TIẾT PHÒNG CHIẾU
const getRoomById = async (req, res) => {
    try {
        const room = await Room.findOne({
            _id: req.params.id,
            isActive: true
        }).populate("cinema", "name address city");

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phòng chiếu."
            });
        }

        return res.status(200).json({
            success: true,
            room
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin phòng chiếu.",
            error: error.message
        });
    }
};

// LẤY PHÒNG CHIẾU THEO RẠP
const getRoomsByCinema = async (req, res) => {
    try {
        const rooms = await Room.find({
            cinema: req.params.cinemaId,
            isActive: true
        }).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            total: rooms.length,
            rooms
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy phòng chiếu của rạp.",
            error: error.message
        });
    }
};

module.exports = {
    getRooms,
    getRoomById,
    getRoomsByCinema
};
