require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Seat = require("./models/Seat");

async function check() {
    try {
        await connectDB();

        const roomId = "6af0c573fac0d5f3fabd8492";

        console.log("\n===== THONG KE LOAI GHE =====");

        const stats = await Seat.aggregate([
            { $match: { room: new mongoose.Types.ObjectId(roomId) } },
            {
                $group: {
                    _id: "$seatType",
                    total: { $sum: 1 },
                    price: { $addToSet: "$price" }
                }
            }
        ]);

        console.table(stats);

        console.log("\n===== DANH SACH GHE HANG H =====");

        const coupleSeats = await Seat.find({
            room: roomId,
            row: "H"
        }).sort({ number: 1 }).lean();

        console.table(coupleSeats.map(s => ({
            seatNumber: s.seatNumber,
            seatType: s.seatType,
            price: s.price
        })));

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

check();
