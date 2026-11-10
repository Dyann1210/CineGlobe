
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Room = require("./models/Room");
const Seat = require("./models/Seat");

const createSeats = (roomId) => {
    const seats = [];
    const rows = ["A", "B", "C", "D", "E"];

    rows.forEach((row) => {
        for (let number = 1; number <= 8; number++) {
            const isVIP = row === "D" || row === "E";

            seats.push({
                room: roomId,
                seatNumber: `${row}${number}`,
                row: row,
                number: number,
                seatType: isVIP ? "vip" : "standard",
                price: isVIP ? 100000 : 75000,
                isActive: true
            });
        }
    });

    return seats;
};

const seedSeats = async () => {
    try {
        await connectDB();

        const roomIds = [
            new mongoose.Types.ObjectId("6af063770abad26a825abf2d"),
            new mongoose.Types.ObjectId("6af063870abad26a825abf2f")
        ];

        for (const roomId of roomIds) {
            const room = await Room.findById(roomId);

            if (!room) {
                throw new Error(`Không tìm thấy phòng: ${roomId}`);
            }

            // Xóa ghế cũ của phòng trước khi tạo lại
            await Seat.deleteMany({ room: roomId });

            const seats = createSeats(roomId);

            await Seat.insertMany(seats);

            console.log(`Đã tạo ${seats.length} ghế cho ${room.name}`);
        }

        console.log("=================================");
        console.log("HOÀN TẤT TẠO 80 GHẾ!");
        console.log("Biên Hòa: 40 ghế");
        console.log("Sài Gòn: 40 ghế");
        console.log("=================================");

    } catch (error) {
        console.error("LỖI TẠO GHẾ:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedSeats();
