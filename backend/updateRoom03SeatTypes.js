require("dotenv").config();

const fs = require("fs");
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Seat = require("./models/Seat");

const ROOM_ID = "6af0c573fac0d5f3fabd8492";

const rules = {
    A: { type: "standard", price: 75000 },
    B: { type: "standard", price: 75000 },
    C: { type: "standard", price: 75000 },
    D: { type: "standard", price: 75000 },
    E: { type: "vip", price: 100000 },
    F: { type: "vip", price: 100000 },
    G: { type: "vip", price: 100000 },
    H: { type: "couple", price: 150000 }
};

async function updateRoom03() {
    try {
        await connectDB();

        const seats = await Seat.find({
            room: ROOM_ID
        }).lean();

        console.log("Tong so ghe hien tai:", seats.length);

        if (seats.length !== 80) {
            throw new Error(
                "Dung cap nhat: Phong khong co dung 80 ghe."
            );
        }

        // Kiem tra moi hang co dung 10 ghe
        const counts = {};

        for (const seat of seats) {
            counts[seat.row] = (counts[seat.row] || 0) + 1;
        }

        for (const row of Object.keys(rules)) {
            if (counts[row] !== 10) {
                throw new Error(
                    `Dung cap nhat: Hang ${row} co ${counts[row] || 0} ghe, can 10 ghe.`
                );
            }
        }

        // Tao ban sao luu truoc khi cap nhat
        const backupFile =
            `backup-room03-seats-${Date.now()}.json`;

        fs.writeFileSync(
            backupFile,
            JSON.stringify(seats, null, 2),
            "utf8"
        );

        console.log("Da tao ban sao luu:", backupFile);

        // Chi cap nhat loai ghe va gia
        const operations = seats.map(seat => {
            const rule = rules[seat.row];

            return {
                updateOne: {
                    filter: { _id: seat._id },
                    update: {
                        $set: {
                            seatType: rule.type,
                            price: rule.price
                        }
                    }
                }
            };
        });

        const result = await Seat.bulkWrite(operations);

        console.log("\n===== KET QUA CAP NHAT =====");
        console.log("So ghe da cap nhat:", result.modifiedCount);

        const verification = await Seat.aggregate([
            {
                $match: {
                    room: new mongoose.Types.ObjectId(ROOM_ID)
                }
            },
            {
                $group: {
                    _id: "$seatType",
                    total: { $sum: 1 },
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        console.table(verification);

        console.log("\nHOAN TAT CAP NHAT PHONG 03!");

    } catch (error) {
        console.error("\nLOI:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

updateRoom03();
