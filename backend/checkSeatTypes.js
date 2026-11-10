
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Seat = require("./models/Seat");

async function checkSeatTypes() {
    try {
        await connectDB();

        const result = await Seat.aggregate([
            {
                $group: {
                    _id: "$seatType",
                    total: { $sum: 1 }
                }
            }
        ]);

        console.log("\n===== THONG KE LOAI GHE =====");
        console.table(result);

        const coupleSeats = await Seat.find({
            seatType: "couple"
        }).select("seatNumber row number price room");

        console.log("\n===== DANH SACH GHE DOI =====");
        console.table(coupleSeats.map(seat => ({
            seatNumber: seat.seatNumber,
            price: seat.price,
            room: seat.room.toString()
        })));

    } catch (error) {
        console.error("Loi:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkSeatTypes();
