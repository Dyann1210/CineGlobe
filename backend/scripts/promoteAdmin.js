
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/database");
const User = require("../models/User");

const promoteAdmin = async () => {
    try {
        const email = process.argv[2]?.trim().toLowerCase();

        if (!email) {
            console.log("Vui long cung cap email tai khoan.");
            console.log("Vi du: node scripts/promoteAdmin.js email@example.com");
            process.exitCode = 1;
            return;
        }

        await connectDB();

        const user = await User.findOne({ email });

        if (!user) {
            console.log("Khong tim thay tai khoan:", email);
            return;
        }

        if (user.role === "admin") {
            console.log("Tai khoan nay da co quyen Admin.");
            return;
        }

        user.role = "admin";
        await user.save();

        console.log("--------------------------------");
        console.log("CAP QUYEN ADMIN THANH CONG!");
        console.log("Email:", user.email);
        console.log("Ho ten:", user.fullName);
        console.log("Role:", user.role);
        console.log("--------------------------------");
    } catch (error) {
        console.error("Loi cap quyen Admin:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

promoteAdmin();
