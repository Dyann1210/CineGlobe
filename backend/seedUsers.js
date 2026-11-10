
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/database");
const User = require("./models/User");

const seedUsers = async () => {
    try {
        await connectDB();

        const accounts = [
            {
                fullName: "Admin",
                email: "admin@cineglobe.com",
                password: "Admin123",
                phone: "0900000001",
                role: "admin"
            },
            {
                fullName: "Thành viên 2",
                email: "thanhvien2@gmail.com",
                password: "User123",
                phone: "0900000002",
                role: "customer"
            },
            {
                fullName: "Thành viên 3",
                email: "thanhvien3@gmail.com",
                password: "User123",
                phone: "0900000003",
                role: "customer"
            },
            {
                fullName: "Thành viên 4",
                email: "thanhvien4@gmail.com",
                password: "User123",
                phone: "0900000004",
                role: "customer"
            }
        ];

        for (const account of accounts) {
            const existingUser = await User.findOne({
                email: account.email
            });

            if (existingUser) {
                console.log("Đã tồn tại:", account.email);
                continue;
            }

            const hashedPassword = await bcrypt.hash(
                account.password,
                12
            );

            await User.create({
                ...account,
                password: hashedPassword
            });

            console.log("Đã tạo:", account.email);
        }

        console.log("=================================");
        console.log("HOÀN TẤT TẠO TÀI KHOẢN!");
        console.log("=================================");

    } catch (error) {
        console.error("LỖI TẠO TÀI KHOẢN:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedUsers();
