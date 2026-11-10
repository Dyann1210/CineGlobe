const express = require("express");
const router = express.Router();

const {
    register,
    login,
    googleLogin,
    getMe
} = require("../controllers/authController");

const {
    forgotPassword,
    resetPassword
} = require("../controllers/passwordResetController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, getMe);

module.exports = router;