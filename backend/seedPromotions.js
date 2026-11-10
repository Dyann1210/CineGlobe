
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Promotion = require("./models/Promotion");

const seedPromotions = async () => {
    try {
        await connectDB();

        const now = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const promotions = [
            {
                name: "Giảm 10% vé xem phim",
                code: "CINE10",
                description: "Giảm 10% tổng giá trị đơn hàng khi đặt vé.",
                discountType: "percentage",
                discountValue: 10,
                maxDiscount: 30000,
                minOrderAmount: 75000,
                startDate: now,
                endDate,
                usageLimit: 500,
                usedCount: 0,
                isActive: true
            },
            {
                name: "Giảm 20.000đ",
                code: "CINE20K",
                description: "Giảm trực tiếp 20.000đ cho đơn hàng từ 150.000đ.",
                discountType: "fixed",
                discountValue: 20000,
                maxDiscount: 20000,
                minOrderAmount: 150000,
                startDate: now,
                endDate,
                usageLimit: 300,
                usedCount: 0,
                isActive: true
            },
            {
                name: "Ưu đãi thành viên",
                code: "MEMBER15",
                description: "Giảm 15% cho khách hàng khi đặt vé.",
                discountType: "percentage",
                discountValue: 15,
                maxDiscount: 50000,
                minOrderAmount: 100000,
                startDate: now,
                endDate,
                usageLimit: 200,
                usedCount: 0,
                isActive: true
            }
        ];

        for (const promotion of promotions) {
            await Promotion.updateOne(
                { code: promotion.code },
                { $set: promotion },
                { upsert: true }
            );
        }

        console.log("=================================");
        console.log("TẠO KHUYẾN MÃI THÀNH CÔNG!");
        console.log("Số mã khuyến mãi:", promotions.length);
        promotions.forEach(p => console.log("-", p.code));
        console.log("=================================");

    } catch (error) {
        console.error("LỖI TẠO KHUYẾN MÃI:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedPromotions();
