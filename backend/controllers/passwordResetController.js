const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");

const hashOTP = (otp) => {
    return crypto
        .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
        .update(otp)
        .digest("hex");
};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập địa chỉ email hợp lệ."
            });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
            console.error("EMAIL CONFIGURATION IS MISSING");

            return res.status(500).json({
                success: false,
                message: "Máy chủ chưa cấu hình dịch vụ gửi email."
            });
        }

        const genericMessage =
            "Nếu email thuộc tài khoản hợp lệ, mã OTP sẽ được gửi đến hộp thư của bạn.";

        const user = await User.findOne({ email });

        // Không tiết lộ email có đăng ký hay không.
        if (!user || !user.password) {
            return res.json({
                success: true,
                message: genericMessage
            });
        }

        const existing = await PasswordReset.findOne({ email });

        // Giới hạn gửi lại mã: 60 giây.
        if (
            existing &&
            Date.now() - existing.lastSentAt.getTime() < 60000
        ) {
            return res.status(429).json({
                success: false,
                message: "Vui lòng chờ 60 giây trước khi yêu cầu mã mới."
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        await PasswordReset.findOneAndUpdate(
            { email },
            {
                email,
                otpHash: hashOTP(otp),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                attempts: 0,
                lastSentAt: new Date()
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        try {
            await transporter.sendMail({
                from: `"CineGlobe" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Mã OTP khôi phục mật khẩu CineGlobe",
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:25px;border-radius:15px;background:#f8f5ff;">
                        <h2 style="color:#7c3aed;text-align:center;">
                            🎬 CINEGLOBE
                        </h2>

                        <h3>Khôi phục mật khẩu</h3>

                        <p>Bạn vừa yêu cầu khôi phục mật khẩu tài khoản CineGlobe.</p>

                        <div style="background:white;padding:20px;text-align:center;border-radius:12px;">
                            <h1 style="color:#7c3aed;letter-spacing:10px;">
                                ${otp}
                            </h1>
                        </div>

                        <p>Mã OTP có hiệu lực trong <b>5 phút</b> và chỉ được sử dụng một lần.</p>

                        <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>

                        <hr/>

                        <p style="color:#777;font-size:12px;">
                            CineGlobe - Thế giới điện ảnh trong tầm tay.
                        </p>
                    </div>
                `
            });
        } catch (mailError) {
            console.error("SEND OTP EMAIL ERROR:", mailError);

            await PasswordReset.deleteOne({ email });

            return res.status(500).json({
                success: false,
                message: "Không thể gửi email OTP. Vui lòng kiểm tra cấu hình Gmail."
            });
        }

        return res.json({
            success: true,
            message: genericMessage
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể xử lý yêu cầu khôi phục mật khẩu."
        });
    }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        const otp = String(req.body.otp || "").trim();
        const newPassword = String(req.body.newPassword || "");

        if (!email || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Email hoặc mã OTP không hợp lệ."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu mới phải có ít nhất 6 ký tự."
            });
        }

        const resetRecord = await PasswordReset.findOne({ email });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: "Mã OTP không tồn tại hoặc đã hết hạn."
            });
        }

        if (resetRecord.expiresAt.getTime() <= Date.now()) {
            await PasswordReset.deleteOne({ _id: resetRecord._id });

            return res.status(400).json({
                success: false,
                message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới."
            });
        }

        if (resetRecord.attempts >= 5) {
            await PasswordReset.deleteOne({ _id: resetRecord._id });

            return res.status(429).json({
                success: false,
                message: "Bạn đã nhập sai OTP quá số lần cho phép. Hãy yêu cầu mã mới."
            });
        }

        const submittedHash = hashOTP(otp);

        const isMatch = crypto.timingSafeEqual(
            Buffer.from(submittedHash, "hex"),
            Buffer.from(resetRecord.otpHash, "hex")
        );

        if (!isMatch) {
            resetRecord.attempts += 1;
            await resetRecord.save();

            return res.status(400).json({
                success: false,
                message: "Mã OTP không chính xác."
            });
        }

        const user = await User.findOne({ email });

        if (!user || !user.password) {
            return res.status(400).json({
                success: false,
                message: "Tài khoản này sử dụng Google Login."
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        await PasswordReset.deleteOne({ _id: resetRecord._id });

        return res.json({
            success: true,
            message: "Khôi phục mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể đặt lại mật khẩu."
        });
    }
};

module.exports = {
    forgotPassword,
    resetPassword
};