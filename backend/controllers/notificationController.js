const Notification = require("../models/Notification");

// LẤY DANH SÁCH THÔNG BÁO CỦA TÀI KHOẢN
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user._id
        }).sort({ createdAt: -1 }).limit(50);

        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể tải thông báo."
        });
    }
};

// ĐÁNH DẤU MỘT THÔNG BÁO ĐÃ ĐỌC
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông báo."
            });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
        }

        return res.status(200).json({
            success: true,
            message: "Đã đánh dấu thông báo đã đọc.",
            notification
        });
    } catch (error) {
        console.error("Mark notification read error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật thông báo."
        });
    }
};

// ĐÁNH DẤU TẤT CẢ THÔNG BÁO ĐÃ ĐỌC
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                user: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Đã đọc tất cả thông báo."
        });
    } catch (error) {
        console.error("Mark all notifications read error:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật thông báo."
        });
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
