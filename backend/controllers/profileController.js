
const User = require("../models/User");
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");

// Calculate membership tier from real accumulated points.
const getMembershipTier = (points) => {
    const tiers = [
        { name: "Bronze", minPoints: 0, nextPoints: 500 },
        { name: "Silver", minPoints: 500, nextPoints: 1500 },
        { name: "Gold", minPoints: 1500, nextPoints: 4000 },
        { name: "Platinum", minPoints: 4000, nextPoints: null }
    ];

    const current = [...tiers]
        .reverse()
        .find(tier => points >= tier.minPoints);

    if (!current.nextPoints) {
        return {
            ...current,
            progress: 100,
            pointsToNext: 0
        };
    }

    const progress = Math.min(
        100,
        Math.floor(
            ((points - current.minPoints) /
                (current.nextPoints - current.minPoints)) * 100
        )
    );

    return {
        ...current,
        progress,
        pointsToNext: Math.max(0, current.nextPoints - points)
    };
};

// Build badges from actual account activity.
const buildBadges = ({ bookingCount, ticketCount, totalSpent }) => {
    return [
        {
            id: "first-booking",
            name: "Tân binh CineGlobe",
            description: "Hoàn thành đơn đặt vé đầu tiên",
            icon: "ticket",
            earned: bookingCount >= 1
        },
        {
            id: "movie-lover",
            name: "Mê phim",
            description: "Hoàn thành 5 đơn đặt vé",
            icon: "clapperboard",
            earned: bookingCount >= 5
        },
        {
            id: "cinephile",
            name: "Tín đồ điện ảnh",
            description: "Hoàn thành 10 đơn đặt vé",
            icon: "film",
            earned: bookingCount >= 10
        },
        {
            id: "big-spender",
            name: "Khách hàng thân thiết",
            description: "Tổng chi tiêu đạt 1.000.000đ",
            icon: "crown",
            earned: totalSpent >= 1000000
        },
        {
            id: "ticket-collector",
            name: "Nhà sưu tập vé",
            description: "Sở hữu 20 vé không bị hủy",
            icon: "award",
            earned: ticketCount >= 20
        }
    ];
};

// GET /api/profile/me
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const [user, paidBookings, ticketCount] = await Promise.all([
            User.findById(userId).select("-password"),

            Booking.find({
                user: userId,
                status: "confirmed",
                paymentStatus: "paid"
            })
                .populate("movie", "title poster")
                .populate("cinema", "name")
                .populate("showtime", "startTime")
                .sort({ createdAt: -1 }),

            Ticket.countDocuments({
                user: userId,
                status: { $in: ["valid", "used"] }
            })
        ]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản."
            });
        }

        const totalSpent = paidBookings.reduce(
            (sum, booking) => sum + Number(booking.finalAmount || 0),
            0
        );

        // 1 point for every 10,000 VND actually paid.
        const points = Math.floor(totalSpent / 10000);

        const membership = getMembershipTier(points);

        const stats = {
            totalBookings: paidBookings.length,
            totalTickets: ticketCount,
            totalSpent,
            points
        };

        const badges = buildBadges({
            bookingCount: stats.totalBookings,
            ticketCount: stats.totalTickets,
            totalSpent: stats.totalSpent
        });

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                memberCode: `CG-${String(user._id).slice(-8).toUpperCase()}`,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role,
                createdAt: user.createdAt
            },
            membership,
            stats,
            badges,
            recentBookings: paidBookings.slice(0, 5)
        });

    } catch (error) {
        console.error("GET PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể tải thông tin hồ sơ.",
            error: error.message
        });
    }
};

// PUT /api/profile/me
const updateMyProfile = async (req, res) => {
    try {
        const { fullName, phone, avatar } = req.body;

        const updates = {};

        if (fullName !== undefined) {
            if (
                typeof fullName !== "string" ||
                fullName.trim().length < 2 ||
                fullName.trim().length > 80
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Họ tên phải có từ 2 đến 80 ký tự."
                });
            }

            updates.fullName = fullName.trim();
        }

        if (phone !== undefined) {
            if (
                typeof phone !== "string" ||
                phone.length > 20
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Số điện thoại không hợp lệ."
                });
            }

            updates.phone = phone.trim();
        }

        if (avatar !== undefined) {
            if (
                typeof avatar !== "string" ||
                avatar.length > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Thông tin ảnh đại diện không hợp lệ."
                });
            }

            updates.avatar = avatar.trim();
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản."
            });
        }

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
        console.error("UPDATE PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật hồ sơ.",
            error: error.message
        });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile
};
