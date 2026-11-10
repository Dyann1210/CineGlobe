const mongoose = require("mongoose");

const Cinema = require("../models/Cinema");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Booking = require("../models/Booking");

const validId = (id) => mongoose.isValidObjectId(id);

// Tạo slug từ tên rạp
const makeSlug = (value) => {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
};

// Tạo danh sách ghế cho phòng
const generateSeats = (room) => {
    const seats = [];

    for (let rowIndex = 0; rowIndex < room.totalRows; rowIndex++) {
        const row = String.fromCharCode(65 + rowIndex);

        for (let number = 1; number <= room.seatsPerRow; number++) {
            const seatType =
                room.roomType === "vip"
                    ? "vip"
                    : room.roomType === "couple"
                        ? "couple"
                        : "standard";

            seats.push({
                room: room._id,
                seatNumber: `${row}${number}`,
                row,
                number,
                seatType,
                isActive: true
            });
        }
    }

    return seats;
};

// ============================================
// QUẢN LÝ RẠP CHIẾU PHIM
// ============================================

// GET /api/admin/cinemas
const getAdminCinemas = async (req, res) => {
    try {
        const cinemas = await Cinema.find()
            .sort({ createdAt: -1 })
            .lean();

        const data = await Promise.all(
            cinemas.map(async (cinema) => {
                const roomCount = await Room.countDocuments({
                    cinema: cinema._id
                });

                return {
                    ...cinema,
                    roomCount
                };
            })
        );

        return res.json({
            success: true,
            data,
            total: data.length
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách rạp.",
            error: error.message
        });
    }
};

// POST /api/admin/cinemas
const createAdminCinema = async (req, res) => {
    try {
        const {
            name,
            address,
            city,
            district,
            description,
            image,
            phone,
            facilities,
            isActive
        } = req.body;

        if (!name || !address || !city) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập tên rạp, địa chỉ và thành phố."
            });
        }

        let slug = makeSlug(name);

        const existingSlug = await Cinema.findOne({ slug });

        if (existingSlug) {
            slug = `${slug}-${Date.now()}`;
        }

        const cinema = await Cinema.create({
            name: name.trim(),
            slug,
            address: address.trim(),
            city: city.trim(),
            district,
            description,
            image,
            phone,
            facilities: Array.isArray(facilities) ? facilities : [],
            isActive: isActive !== undefined ? isActive : true
        });

        return res.status(201).json({
            success: true,
            message: "Thêm rạp chiếu phim thành công.",
            data: cinema
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể thêm rạp chiếu phim.",
            error: error.message
        });
    }
};

// PUT /api/admin/cinemas/:id
const updateAdminCinema = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID rạp không hợp lệ."
            });
        }

        const allowedFields = [
            "name",
            "address",
            "city",
            "district",
            "description",
            "image",
            "phone",
            "facilities",
            "isActive"
        ];

        const updateData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (updateData.name) {
            updateData.name = updateData.name.trim();
        }

        if (updateData.address) {
            updateData.address = updateData.address.trim();
        }

        if (updateData.city) {
            updateData.city = updateData.city.trim();
        }

        const cinema = await Cinema.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!cinema) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy rạp."
            });
        }

        return res.json({
            success: true,
            message: "Cập nhật rạp thành công.",
            data: cinema
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật rạp.",
            error: error.message
        });
    }
};

// DELETE /api/admin/cinemas/:id
const deleteAdminCinema = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID rạp không hợp lệ."
            });
        }

        const cinema = await Cinema.findById(id);

        if (!cinema) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy rạp."
            });
        }

        const roomCount = await Room.countDocuments({
            cinema: id
        });

        const showtimeCount = await Showtime.countDocuments({
            cinema: id
        });

        const bookingCount = await Booking.countDocuments({
            cinema: id
        });

        if (roomCount > 0 || showtimeCount > 0 || bookingCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa rạp đang có phòng chiếu, suất chiếu hoặc đơn đặt vé. Bạn có thể chuyển rạp sang trạng thái ngừng hoạt động."
            });
        }

        await Cinema.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Xóa rạp thành công."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể xóa rạp.",
            error: error.message
        });
    }
};

// ============================================
// QUẢN LÝ PHÒNG CHIẾU
// ============================================

// GET /api/admin/rooms
const getAdminRooms = async (req, res) => {
    try {
        const filter = {};

        if (req.query.cinemaId) {
            if (!validId(req.query.cinemaId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID rạp không hợp lệ."
                });
            }

            filter.cinema = req.query.cinemaId;
        }

        if (req.query.roomType) {
            filter.roomType = req.query.roomType;
        }

        const rooms = await Room.find(filter)
            .populate("cinema", "name city address")
            .sort({ createdAt: -1 })
            .lean();

        const data = await Promise.all(
            rooms.map(async (room) => {
                const seatCount = await Seat.countDocuments({
                    room: room._id
                });

                return {
                    ...room,
                    seatCount
                };
            })
        );

        return res.json({
            success: true,
            data,
            total: data.length
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách phòng chiếu.",
            error: error.message
        });
    }
};

// POST /api/admin/rooms
const createAdminRoom = async (req, res) => {
    let createdRoom = null;

    try {
        const {
            name,
            cinema,
            roomType,
            totalRows,
            seatsPerRow,
            screenType,
            isActive
        } = req.body;

        if (
            !name ||
            !cinema ||
            !totalRows ||
            !seatsPerRow
        ) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập tên phòng, rạp, số hàng và số ghế mỗi hàng."
            });
        }

        if (!validId(cinema)) {
            return res.status(400).json({
                success: false,
                message: "ID rạp không hợp lệ."
            });
        }

        const cinemaExists = await Cinema.findById(cinema);

        if (!cinemaExists) {
            return res.status(404).json({
                success: false,
                message: "Rạp chiếu phim không tồn tại."
            });
        }

        const rows = Number(totalRows);
        const seats = Number(seatsPerRow);

        if (
            !Number.isInteger(rows) ||
            !Number.isInteger(seats) ||
            rows < 1 ||
            seats < 1 ||
            rows > 26 ||
            seats > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Số hàng phải từ 1 đến 26 và số ghế mỗi hàng phải từ 1 đến 50."
            });
        }

        createdRoom = await Room.create({
            name: name.trim(),
            cinema,
            roomType: roomType || "standard",
            totalRows: rows,
            seatsPerRow: seats,
            screenType: screenType || "2D",
            isActive: isActive !== undefined ? isActive : true
        });

        const seatData = generateSeats(createdRoom);

        await Seat.insertMany(seatData);

        return res.status(201).json({
            success: true,
            message: "Tạo phòng chiếu và sơ đồ ghế thành công.",
            data: {
                ...createdRoom.toObject(),
                totalSeats: seatData.length
            }
        });
    } catch (error) {
        // Nếu tạo ghế lỗi, xóa dữ liệu phòng vừa tạo
        if (createdRoom) {
            await Seat.deleteMany({
                room: createdRoom._id
            }).catch(() => {});

            await Room.findByIdAndDelete(
                createdRoom._id
            ).catch(() => {});
        }

        return res.status(500).json({
            success: false,
            message: "Không thể tạo phòng chiếu.",
            error: error.message
        });
    }
};

// PUT /api/admin/rooms/:id
const updateAdminRoom = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID phòng không hợp lệ."
            });
        }

        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phòng chiếu."
            });
        }

        const dimensionChanged =
            (
                req.body.totalRows !== undefined &&
                Number(req.body.totalRows) !== room.totalRows
            ) ||
            (
                req.body.seatsPerRow !== undefined &&
                Number(req.body.seatsPerRow) !== room.seatsPerRow
            );

        if (dimensionChanged) {
            const showtimeCount = await Showtime.countDocuments({
                room: id
            });

            const bookingCount = await Booking.countDocuments({
                room: id
            });

            if (showtimeCount > 0 || bookingCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Không thể thay đổi kích thước phòng khi phòng đã có suất chiếu hoặc đơn đặt vé."
                });
            }

            return res.status(400).json({
                success: false,
                message: "Không hỗ trợ thay đổi số hàng hoặc số ghế sau khi tạo phòng. Vui lòng tạo phòng mới để đảm bảo sơ đồ ghế chính xác."
            });
        }

        const allowedFields = [
            "name",
            "roomType",
            "screenType",
            "isActive"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                room[field] = req.body[field];
            }
        });

        if (req.body.name !== undefined) {
            room.name = String(req.body.name).trim();
        }

        await room.save();

        return res.json({
            success: true,
            message: "Cập nhật phòng chiếu thành công.",
            data: room
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật phòng chiếu.",
            error: error.message
        });
    }
};

// DELETE /api/admin/rooms/:id
const deleteAdminRoom = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID phòng không hợp lệ."
            });
        }

        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phòng chiếu."
            });
        }

        const showtimeCount = await Showtime.countDocuments({
            room: id
        });

        const bookingCount = await Booking.countDocuments({
            room: id
        });

        if (showtimeCount > 0 || bookingCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa phòng đang có suất chiếu hoặc đơn đặt vé."
            });
        }

        await Seat.deleteMany({
            room: id
        });

        await Room.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Xóa phòng và các ghế liên quan thành công."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể xóa phòng.",
            error: error.message
        });
    }
};

module.exports = {
    getAdminCinemas,
    createAdminCinema,
    updateAdminCinema,
    deleteAdminCinema,
    getAdminRooms,
    createAdminRoom,
    updateAdminRoom,
    deleteAdminRoom
};