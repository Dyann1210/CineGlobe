const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { chatWithGlobeAI } = require("../controllers/aiController");

const router = express.Router();

// Xác thực tùy chọn:
// Khách chưa đăng nhập vẫn chat được.
// Khách đăng nhập sẽ được phép hỏi về vé của chính mình.
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id).select("-password");

        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        // Token hết hạn hoặc không hợp lệ:
        // vẫn cho phép sử dụng chức năng chat công khai.
        next();
    }
};

router.post("/chat", optionalAuth, chatWithGlobeAI);

module.exports = router;