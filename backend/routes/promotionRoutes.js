const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    getPromotions,
    getPublicPromotions,
    createPromotion,
    updatePromotion,
    togglePromotion,
    deletePromotion,
    applyPromotion
} = require("../controllers/promotionController");

// Khach hang dang nhap ap dung ma
router.post("/apply", authMiddleware, applyPromotion);

// API cong khai - Trang chu
router.get('/public', getPublicPromotions);

// Cac API quan tri
router.get("/", authMiddleware, adminMiddleware, getPromotions);
router.post("/", authMiddleware, adminMiddleware, createPromotion);
router.put("/:id", authMiddleware, adminMiddleware, updatePromotion);
router.patch("/:id/toggle", authMiddleware, adminMiddleware, togglePromotion);
router.delete("/:id", authMiddleware, adminMiddleware, deletePromotion);

module.exports = router;