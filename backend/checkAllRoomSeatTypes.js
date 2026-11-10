require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");

require("./models/Cinema");

const Room = require("./models/Room");
const Seat = require("./models/Seat");

async function checkAllRooms() {
    try {
        await connectDB();

        const rooms = await Room.find({})
            .populate("cinema", "name city")
            .sort({ name: 1 });

        console.log("\n===== DANH SACH PHONG CHIEU =====");

        console.table(rooms.map(r => ({
            RoomID: r._id.toString(),
            Room: r.name,
            Cinema: r.cinema?.name,
            RoomType: r.roomType,
            TotalRows: r.totalRows,
            SeatsPerRow: r.seatsPerRow,
            TotalSeats: r.totalSeats
        })));

        console.log("\n===== THONG KE LOAI GHE TUNG PHONG =====");

        for (const room of rooms) {
            const stats = await Seat.aggregate([
                {
                    $match: {
                        room: room._id
                    }
                },
                {
                    $group: {
                        _id: "$seatType",
                        total: { $sum: 1 },
                        minPrice: { $min: "$price" },
                        maxPrice: { $max: "$price" }
                    }
                }
            ]);

            console.log(`\n${room.name} - ${room.cinema?.name}`);
            console.log(`Room ID: ${room._id}`);
            console.table(stats);

            const rows = await Seat.aggregate([
                {
                    $match: {
                        room: room._id,
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: "$row",
                        total: { $sum: 1 },
                        types: { $addToSet: "$seatType" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            console.log("Phan loai theo hang:");
            console.table(rows);
        }

    } catch (error) {
        console.error("LOI:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAllRooms();
