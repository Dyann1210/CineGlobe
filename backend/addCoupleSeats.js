
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Room = require("./models/Room");
const Seat = require("./models/Seat");

const roomIds = [
    "6af063770abad26a825abf2d",
    "6af063870abad26a825abf2f"
];

async function addCoupleSeats() {
    try {
        await connectDB();

        let added = 0;

        for (const roomId of roomIds) {
            const room = await Room.findById(roomId);

            if (!room) {
                console.log("Không tìm thấy phòng:", roomId);
                continue;
            }

            for (let number = 1; number <= 4; number++) {
                const seatNumber = `F${number}`;

                const exists = await Seat.findOne({
                    room: roomId,
                    seatNumber
                });

                if (exists) {
                    console.log(`Đã tồn tại ghế ${seatNumber}`);
                    continue;
                }

                await Seat.create({
                    room: roomId,
                    seatNumber,
                    row: "F",
                    number,
                    seatType: "couple",
                    price: 150000,
                    isActive: true
                });

                added++;
                console.log(`Đã thêm ghế đôi ${seatNumber}`);
            }
        }

        console.log(`\nHoàn tất! Đã thêm ${added} ghế đôi.`);

    } catch (error) {
        console.error("Lỗi:", error);
    } finally {
        await mongoose.disconnect();
    }
}

addCoupleSeats();
