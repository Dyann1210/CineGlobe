
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");

const Movie = require("./models/Movie");
const Room = require("./models/Room");
const Seat = require("./models/Seat");
const Showtime = require("./models/Showtime");

const seedShowtimes = async () => {
    try {
        await connectDB();

        const movies = await Movie.find({ status: "now_showing" }).sort({ createdAt: 1 });
        const rooms = await Room.find({ isActive: true });

        if (movies.length === 0) {
            throw new Error("Chưa có phim đang chiếu trong database!");
        }

        if (rooms.length === 0) {
            throw new Error("Chưa có phòng chiếu trong database!");
        }

        const operations = [];

        // Tạo lịch chiếu trong 3 ngày tiếp theo
        for (let day = 1; day <= 3; day++) {
            for (const room of rooms) {
                const availableSeats = await Seat.countDocuments({
                    room: room._id,
                    isActive: true
                });

                if (availableSeats === 0) {
                    console.log(`Bỏ qua phòng ${room.name} vì chưa có ghế.`);
                    continue;
                }

                for (let i = 0; i < movies.length; i++) {
                    const movie = movies[i];

                    // Mỗi phim có một giờ chiếu riêng trong ngày
                    const startHour = 10 + i * 3;

                    const startTime = new Date();
                    startTime.setDate(startTime.getDate() + day);
                    startTime.setHours(startHour, 0, 0, 0);

                    const date = new Date(startTime);
                    date.setHours(0, 0, 0, 0);

                    const duration = movie.duration || 120;
                    const endTime = new Date(
                        startTime.getTime() + duration * 60 * 1000
                    );

                    const cinemaId = room.cinema;

                    operations.push({
                        updateOne: {
                            filter: {
                                movie: movie._id,
                                cinema: cinemaId,
                                startTime: startTime
                            },
                            update: {
                                $set: {
                                    movie: movie._id,
                                    cinema: cinemaId,
                                    room: room._id,
                                    date: date,
                                    startTime: startTime,
                                    endTime: endTime,
                                    price: 75000,
                                    status: "scheduled",
                                    availableSeats: availableSeats
                                }
                            },
                            upsert: true
                        }
                    });
                }
            }
        }

        if (operations.length === 0) {
            throw new Error("Không có suất chiếu hợp lệ để tạo!");
        }

        const result = await Showtime.bulkWrite(operations);

        console.log("=================================");
        console.log("TẠO SUẤT CHIẾU THÀNH CÔNG!");
        console.log("Phim đang chiếu:", movies.length);
        console.log("Phòng chiếu:", rooms.length);
        console.log("Số suất chiếu:", operations.length);
        console.log("Tạo mới:", result.upsertedCount);
        console.log("Cập nhật:", result.modifiedCount);
        console.log("=================================");

    } catch (error) {
        console.error("LỖI TẠO SUẤT CHIẾU:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedShowtimes();
