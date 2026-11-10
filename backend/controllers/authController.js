const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

const createToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const formatUser = (user) => ({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role
});

// ĐĂNG KÝ TÀI KHOẢN
const register = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu!"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu phải có ít nhất 6 ký tự!"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email này đã được đăng ký!"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone || "",
            role: "customer",
            authProvider: "local"
        });

        const token = createToken(user);

        return res.status(201).json({
            success: true,
            message: "Đăng ký tài khoản thành công!",
            token,
            user: formatUser(user)
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi đăng ký tài khoản!"
        });
    }
};

// ĐĂNG NHẬP EMAIL VÀ MẬT KHẨU
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập email và mật khẩu!"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không chính xác!"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không chính xác!"
            });
        }

        const token = createToken(user);

        return res.json({
            success: true,
            message: "Đăng nhập thành công!",
            token,
            user: formatUser(user)
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi đăng nhập!"
        });
    }
};

// ĐĂNG NHẬP BẰNG GOOGLE
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Không nhận được Google ID Token!"
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error("GOOGLE_CLIENT_ID is missing.");

            return res.status(500).json({
                success: false,
                message: "Máy chủ chưa cấu hình Google Login!"
            });
        }

        // Xác minh token trực tiếp với Google
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            payload.email_verified !== true
        ) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản Google chưa được xác minh email!"
            });
        }

        const googleId = payload.sub;
        const normalizedEmail = payload.email.trim().toLowerCase();

        // Tìm tài khoản đã liên kết Google hoặc cùng email
        let user = await User.findOne({
            $or: [
                { googleId },
                { email: normalizedEmail }
            ]
        });

        if (user) {
            // Không cho phép một tài khoản bị liên kết với Google ID khác
            if (user.googleId && user.googleId !== googleId) {
                return res.status(409).json({
                    success: false,
                    message: "Tài khoản này đã liên kết với Google khác!"
                });
            }

            // Liên kết Google với tài khoản hiện có
            user.googleId = googleId;

            if (!user.avatar && payload.picture) {
                user.avatar = payload.picture;
            }

            await user.save();

        } else {
            // Tạo tài khoản mới nếu email chưa tồn tại
            user = await User.create({
                fullName: payload.name || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                googleId,
                authProvider: "google",
                avatar: payload.picture || "",
                phone: "",
                role: "customer"
            });
        }

        const token = createToken(user);

        return res.json({
            success: true,
            message: "Đăng nhập Google thành công!",
            token,
            user: formatUser(user)
        });

    } catch (error) {
        console.error("GOOGLE LOGIN ERROR:", error);

        return res.status(401).json({
            success: false,
            message: "Không thể xác minh tài khoản Google. Vui lòng thử lại!"
        });
    }
};

// LẤY THÔNG TIN TÀI KHOẢN
const getMe = async (req, res) => {
    try {
        return res.json({
            success: true,
            user: formatUser(req.user)
        });
    } catch (error) {
        console.error("GET ME ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin tài khoản!"
        });
    }
};

module.exports = {
    register,
    login,
    googleLogin,
    getMe
};