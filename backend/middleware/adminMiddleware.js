
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Vui lòng đăng nhập để tiếp tục."
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Bạn không có quyền truy cập chức năng quản trị."
        });
    }

    next();
};

module.exports = adminMiddleware;
