const Payment = require("../models/Payment");

// GET /api/admin/payments
// Lấy danh sách giao dịch dành cho Admin
const getAdminPayments = async (req, res) => {
    try {
        const { status, paymentMethod, keyword } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }

        if (keyword) {
            const regex = new RegExp(keyword.trim(), "i");

            const matchingUsers = await require("../models/User").find({
                $or: [
                    { fullName: regex },
                    { email: regex }
                ]
            }).select("_id");

            const matchingBookings = await require("../models/Booking").find({
                bookingCode: regex
            }).select("_id");

            filter.$or = [
                { transactionCode: regex },
                { description: regex },
                { user: { $in: matchingUsers.map(u => u._id) } },
                { booking: { $in: matchingBookings.map(b => b._id) } }
            ];
        }

        const payments = await Payment.find(filter)
            .populate("user", "fullName email phone")
            .populate(
                "booking",
                "bookingCode finalAmount totalAmount status paymentStatus"
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            total: payments.length,
            payments
        });

    } catch (error) {
        console.error("Get admin payments error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể tải danh sách giao dịch.",
            error: error.message
        });
    }
};

module.exports = {
    getAdminPayments
};