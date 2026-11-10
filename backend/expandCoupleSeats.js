
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Seat = require("./models/Seat");

const roomIds = [
    "6af063770abad26a825abf2d",
    "6af063870abad26a825abf2f"
];

async function expandCoupleSeats() {
    try {
        await connectDB();

        let added = 0;

        for (const roomId of roomIds) {
            for (let number = 5; number <= 8; number++) {
                const seatNumber = `F${number}`;

                const exists = await Seat.findOne({
                    room: roomId,
                    seatNumber
                });

                if (exists) {
                    console.log(`Đã có ${seatNumber}, bỏ qua.`);
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
                console.log(`Đã thêm ${seatNumber}`);
            }
        }

        console.log(`Hoàn tất! Thêm ${added} ghế đôi.`);
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

expandCoupleSeats();
