require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");

// Nạp các model để Mongoose nhận diện populate
require("./models/Cinema");
require("./models/Room");

const Showtime = require("./models/Showtime");
const Seat = require("./models/Seat");

async function diagnose() {
    try {
        await connectDB();

        const movieId = new mongoose.Types.ObjectId(
            "6af0ab607eb9ed0288706b45"
        );

        console.log("\n===== SUAT CHIEU SPY X FAMILY CODE: WHITE =====");

        const showtimes = await Showtime.find({ movie: movieId })
            .populate("cinema", "name city district")
            .populate("room", "name roomType totalSeats")
            .sort({ startTime: -1 });

        console.table(showtimes.map(s => ({
            ShowtimeID: s._id.toString(),
            Cinema: s.cinema?.name,
            Room: s.room?.name,
            RoomID: s.room?._id?.toString(),
            RoomType: s.room?.roomType,
            TotalSeats: s.room?.totalSeats,
            StartTime: s.startTime,
            Status: s.status
        })));

        console.log("\n===== THONG KE LOAI GHE THEO TUNG PHONG =====");

        const roomIds = [
            ...new Set(
                showtimes
                    .filter(s => s.room?._id)
                    .map(s => s.room._id.toString())
            )
        ];

        if (roomIds.length === 0) {
            console.log("Phim chua co suat chieu nao.");
        }

        for (const roomId of roomIds) {
            const room = showtimes.find(
                s => s.room?._id?.toString() === roomId
            )?.room;

            const stats = await Seat.aggregate([
                {
                    $match: {
                        room: new mongoose.Types.ObjectId(roomId)
                    }
                },
                {
                    $group: {
                        _id: "$seatType",
                        total: { $sum: 1 },
                        active: {
                            $sum: {
                                $cond: ["$isActive", 1, 0]
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            console.log(`\nPhong: ${room?.name}`);
            console.log(`Room ID: ${roomId}`);
            console.table(stats);

            const seats = await Seat.find({
                room: roomId,
                isActive: true
            }).select("seatNumber row seatType price");

            console.log("Danh sach ghe dang hoat dong:");
            console.table(seats.map(s => ({
                Seat: s.seatNumber,
                Row: s.row,
                Type: s.seatType,
                Price: s.price
            })));
        }

    } catch (error) {
        console.error("LOI:", error);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
