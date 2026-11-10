
const Ticket = require("../models/Ticket");
const QRCode = require("qrcode");
const crypto = require("crypto");

// TẠO VÉ ĐIỆN TỬ CHO CÁC GHẾ TRONG ĐƠN ĐẶT VÉ
const createTicketsForBooking = async (booking) => {
    const createdTickets = [];

    for (const bookingSeat of booking.seats) {
        // Kiểm tra vé đã được tạo trước đó chưa
        const existingTicket = await Ticket.findOne({
            booking: booking._id,
            seat: bookingSeat.seat
        });

        if (existingTicket) {
            createdTickets.push(existingTicket);
            continue;
        }

        // Tạo mã vé duy nhất
        const ticketCode =
            "CGT" +
            Date.now() +
            crypto.randomBytes(3).toString("hex").toUpperCase();

        // Tạo mã QR từ mã vé
        const qrCode = await QRCode.toDataURL(ticketCode);

        // Lưu vé vào MongoDB
        const ticket = await Ticket.create({
            ticketCode,
            booking: booking._id,
            user: booking.user,
            showtime: booking.showtime,
            movie: booking.movie,
            cinema: booking.cinema,
            room: booking.room,
            seat: bookingSeat.seat,
            seatNumber: bookingSeat.seatNumber,
            qrCode,
            price: bookingSeat.price,
            status: "valid"
        });

        createdTickets.push(ticket);
    }

    return createdTickets;
};

// LẤY DANH SÁCH VÉ CỦA NGƯỜI DÙNG
const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({
            user: req.user._id
        })
            .populate("movie", "title poster duration ageRating")
            .populate("cinema", "name address")
            .populate("showtime", "startTime endTime")
            .populate("room", "name roomType")
            .populate("seat", "seatNumber")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        console.error("Get my tickets error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách vé",
            error: error.message
        });
    }
};

// LẤY CHI TIẾT MỘT VÉ
const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            _id: req.params.id,
            user: req.user._id
        })
            .populate("movie")
            .populate("cinema")
            .populate("showtime")
            .populate("room")
            .populate("seat");

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy vé"
            });
        }

        return res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        console.error("Get ticket detail error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy chi tiết vé",
            error: error.message
        });
    }
};


// ADMIN - KIỂM TRA VÀ XÁC NHẬN VÉ BẰNG MÃ QR
const checkInTicket = async (req, res) => {
    try {
        const ticketCode = String(req.body.ticketCode || "")
            .trim()
            .toUpperCase();

        if (!ticketCode || ticketCode.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Mã vé không hợp lệ hoặc đang để trống."
            });
        }

        // Chỉ một yêu cầu được phép chuyển vé từ valid sang used.
        const ticket = await Ticket.findOneAndUpdate(
            {
                ticketCode,
                status: "valid"
            },
            {
                $set: {
                    status: "used",
                    checkedInAt: new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        )
            .populate("movie", "title poster duration ageRating")
            .populate("cinema", "name address")
            .populate("showtime", "startTime endTime")
            .populate("room", "name roomType")
            .populate("seat", "seatNumber")
            .populate("user", "fullName email");

        if (ticket) {
            return res.status(200).json({
                success: true,
                message: "Xác nhận vé thành công. Khách hàng được phép vào rạp.",
                ticket
            });
        }

        // Không tìm thấy vé hợp lệ: kiểm tra lý do cụ thể.
        const existingTicket = await Ticket.findOne({ ticketCode })
            .populate("movie", "title poster duration ageRating")
            .populate("cinema", "name address")
            .populate("showtime", "startTime endTime")
            .populate("room", "name roomType")
            .populate("seat", "seatNumber")
            .populate("user", "fullName email");

        if (!existingTicket) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy vé. Mã QR không tồn tại."
            });
        }

        const statusMessages = {
            used: "Vé này đã được sử dụng trước đó.",
            cancelled: "Vé này đã bị hủy.",
            expired: "Vé này đã hết hạn."
        };

        return res.status(409).json({
            success: false,
            message: statusMessages[existingTicket.status] ||
                "Vé không ở trạng thái hợp lệ để check-in.",
            ticket: existingTicket
        });

    } catch (error) {
        console.error("CHECK-IN TICKET ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể xác nhận vé.",
            error: error.message
        });
    }
};

module.exports = {
    createTicketsForBooking,
    getMyTickets,
    getTicketById,
    checkInTicket
};

