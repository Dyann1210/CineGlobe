const mongoose = require("mongoose");
const Promotion = require("../models/Promotion");
const Booking = require("../models/Booking");

// Lay danh sach khuyen mai - Admin
const getPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find()
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            total: promotions.length,
            promotions
        });
    } catch (error) {
        console.error("GET PROMOTIONS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the tai danh sach khuyen mai."
        });
    }
};


// Lay khuyen mai cong khai cho trang chu CineGlobe
const getPublicPromotions = async (req, res) => {
    try {
        const now = new Date();

        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $or: [
                { usageLimit: 0 },
                { usageLimit: { $exists: false } },
                {
                    $expr: {
                        $lt: [
                            { $ifNull: ["$usageCount", 0] },
                            "$usageLimit"
                        ]
                    }
                }
            ]
        })
        .select("name code description discountType discountValue maxDiscount minOrderAmount startDate endDate usageLimit usageCount")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

        return res.json({
            success: true,
            total: promotions.length,
            promotions
        });
    } catch (error) {
        console.error("GET PUBLIC PROMOTIONS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Khong the tai khuyen mai cong khai."
        });
    }
};
// Tao khuyen mai - Admin
const createPromotion = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            discountType,
            discountValue,
            maxDiscount,
            minOrderAmount,
            startDate,
            endDate,
            usageLimit,
            isActive
        } = req.body;

        if (
            !name ||
            !code ||
            !["percentage", "fixed"].includes(discountType) ||
            discountValue === undefined ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Vui long nhap day du thong tin khuyen mai."
            });
        }

        const normalizedCode = String(code).trim().toUpperCase();

        if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
            return res.status(400).json({
                success: false,
                message: "Ma khuyen mai chi gom chu in hoa, so, gach ngang hoac gach duoi (3-30 ky tu)."
            });
        }

        const value = Number(discountValue);
        const max = Number(maxDiscount || 0);
        const minimum = Number(minOrderAmount || 0);
        const limit = Number(usageLimit || 0);
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
            !Number.isFinite(value) ||
            value <= 0 ||
            !Number.isFinite(max) ||
            max < 0 ||
            !Number.isFinite(minimum) ||
            minimum < 0 ||
            !Number.isInteger(limit) ||
            limit < 0 ||
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start
        ) {
            return res.status(400).json({
                success: false,
                message: "Thong tin gia tri, gioi han hoac thoi gian khuyen mai khong hop le."
            });
        }

        if (discountType === "percentage" && value > 100) {
            return res.status(400).json({
                success: false,
                message: "Phan tram giam khong duoc vuot qua 100%."
            });
        }

        const exists = await Promotion.findOne({
            code: normalizedCode
        });

        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Ma khuyen mai da ton tai."
            });
        }

        const promotion = await Promotion.create({
            name: name.trim(),
            code: normalizedCode,
            description: description || "",
            discountType,
            discountValue: value,
            maxDiscount: max,
            minOrderAmount: minimum,
            startDate: start,
            endDate: end,
            usageLimit: limit,
            isActive: isActive !== false
        });

        return res.status(201).json({
            success: true,
            message: "Tao khuyen mai thanh cong.",
            promotion
        });
    } catch (error) {
        console.error("CREATE PROMOTION ERROR:", error);

        return res.status(error.code === 11000 ? 409 : 500).json({
            success: false,
            message: error.code === 11000
                ? "Ma khuyen mai da ton tai."
                : "Khong the tao khuyen mai."
        });
    }
};

// Cap nhat khuyen mai - Admin
const updatePromotion = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "ID khuyen mai khong hop le."
            });
        }

        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay khuyen mai."
            });
        }

        const body = req.body;

        if (body.name !== undefined) {
            promotion.name = String(body.name).trim();
        }

        if (body.description !== undefined) {
            promotion.description = body.description;
        }

        if (body.discountType !== undefined) {
            promotion.discountType = body.discountType;
        }

        if (body.discountValue !== undefined) {
            promotion.discountValue = Number(body.discountValue);
        }

        if (body.maxDiscount !== undefined) {
            promotion.maxDiscount = Number(body.maxDiscount);
        }

        if (body.minOrderAmount !== undefined) {
            promotion.minOrderAmount = Number(body.minOrderAmount);
        }

        if (body.startDate !== undefined) {
            promotion.startDate = new Date(body.startDate);
        }

        if (body.endDate !== undefined) {
            promotion.endDate = new Date(body.endDate);
        }

        if (body.usageLimit !== undefined) {
            promotion.usageLimit = Number(body.usageLimit);
        }

        if (body.isActive !== undefined) {
            promotion.isActive = Boolean(body.isActive);
        }

        if (
            !promotion.name ||
            !["percentage", "fixed"].includes(promotion.discountType) ||
            !Number.isFinite(promotion.discountValue) ||
            promotion.discountValue <= 0 ||
            promotion.maxDiscount < 0 ||
            promotion.minOrderAmount < 0 ||
            !Number.isInteger(promotion.usageLimit) ||
            promotion.usageLimit < 0 ||
            Number.isNaN(promotion.startDate.getTime()) ||
            Number.isNaN(promotion.endDate.getTime()) ||
            promotion.endDate <= promotion.startDate ||
            (promotion.discountType === "percentage" &&
                promotion.discountValue > 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Thong tin khuyen mai khong hop le."
            });
        }

        if (
            promotion.usageLimit > 0 &&
            promotion.usageLimit < promotion.usageCount
        ) {
            return res.status(400).json({
                success: false,
                message: "Gioi han luot su dung khong duoc nho hon so luot da dung."
            });
        }

        await promotion.save();

        return res.json({
            success: true,
            message: "Cap nhat khuyen mai thanh cong.",
            promotion
        });
    } catch (error) {
        console.error("UPDATE PROMOTION ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the cap nhat khuyen mai."
        });
    }
};

// Bat/tat khuyen mai - Admin
const togglePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay khuyen mai."
            });
        }

        promotion.isActive = !promotion.isActive;
        await promotion.save();

        return res.json({
            success: true,
            message: promotion.isActive
                ? "Da kich hoat khuyen mai."
                : "Da tam dung khuyen mai.",
            promotion
        });
    } catch (error) {
        console.error("TOGGLE PROMOTION ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the thay doi trang thai khuyen mai."
        });
    }
};

// Xoa khuyen mai - Admin
const deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay khuyen mai."
            });
        }

        const usedInBooking = await Booking.exists({
            promotion: promotion._id
        });

        if (usedInBooking) {
            return res.status(400).json({
                success: false,
                message: "Ma nay da duoc gan vao don dat ve. Hay tam dung thay vi xoa."
            });
        }

        await promotion.deleteOne();

        return res.json({
            success: true,
            message: "Xoa khuyen mai thanh cong."
        });
    } catch (error) {
        console.error("DELETE PROMOTION ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the xoa khuyen mai."
        });
    }
};

// Ap dung ma khuyen mai vao don dat ve - Khach hang
const applyPromotion = async (req, res) => {
    try {
        const { bookingId, code } = req.body;

        if (!bookingId || !code) {
            return res.status(400).json({
                success: false,
                message: "Vui long nhap ma khuyen mai."
            });
        }

        const booking = await Booking.findOne({
            _id: bookingId,
            user: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay don dat ve."
            });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Don dat ve khong con hop le."
            });
        }

        if (booking.expiresAt && booking.expiresAt <= new Date()) {
            booking.status = "expired";
            await booking.save();

            return res.status(400).json({
                success: false,
                message: "Don dat ve da het thoi gian giu ghe."
            });
        }

        const promotion = await Promotion.findOne({
            code: String(code).trim().toUpperCase()
        });

        if (!promotion || !promotion.isActive) {
            return res.status(404).json({
                success: false,
                message: "Ma khuyen mai khong ton tai hoac da bi tam dung."
            });
        }

        const now = new Date();

        if (now < promotion.startDate || now > promotion.endDate) {
            return res.status(400).json({
                success: false,
                message: "Ma khuyen mai chua den ngay hoac da het han."
            });
        }

        if (
            promotion.usageLimit > 0 &&
            promotion.usageCount >= promotion.usageLimit
        ) {
            return res.status(400).json({
                success: false,
                message: "Ma khuyen mai da het luot su dung."
            });
        }

        if (booking.totalAmount < promotion.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Don hang toi thieu ${promotion.minOrderAmount.toLocaleString("vi-VN")}d moi duoc ap dung ma nay.`
            });
        }

        let discountAmount = 0;

        if (promotion.discountType === "percentage") {
            discountAmount =
                booking.totalAmount * promotion.discountValue / 100;

            if (promotion.maxDiscount > 0) {
                discountAmount = Math.min(
                    discountAmount,
                    promotion.maxDiscount
                );
            }
        } else {
            discountAmount = promotion.discountValue;
        }

        discountAmount = Math.min(
            booking.totalAmount,
            Math.max(0, Math.round(discountAmount))
        );

        booking.promotion = promotion._id;
        booking.discountAmount = discountAmount;
        booking.finalAmount = Math.max(
            0,
            booking.totalAmount - discountAmount
        );

        await booking.save();

        return res.json({
            success: true,
            message: "Ap dung ma khuyen mai thanh cong.",
            booking,
            promotion: {
                name: promotion.name,
                code: promotion.code,
                discountType: promotion.discountType,
                discountValue: promotion.discountValue
            },
            discountAmount,
            finalAmount: booking.finalAmount
        });
    } catch (error) {
        console.error("APPLY PROMOTION ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the ap dung ma khuyen mai."
        });
    }
};

module.exports = {
    getPromotions,
    getPublicPromotions,
    createPromotion,
    updatePromotion,
    togglePromotion,
    deletePromotion,
    applyPromotion
};