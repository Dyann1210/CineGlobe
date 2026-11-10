
const path = require("path");
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const mongoose = require("mongoose");
const Movie = require("../models/Movie");

async function listMovies() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("Không tìm thấy MONGODB_URI trong backend/.env");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("\n======================================");
        console.log("      DANH SÁCH PHIM TRONG MONGODB");
        console.log("======================================");

        const movies = await Movie.find({
            status: { $in: ["now_showing", "coming_soon"] }
        })
            .select("_id title status trailer")
            .sort({ status: 1, title: 1 })
            .lean();

        console.log(`\nTổng số phim: ${movies.length}\n`);

        movies.forEach((movie, index) => {
            console.log("--------------------------------------");
            console.log(`STT: ${index + 1}`);
            console.log(`ID: ${movie._id}`);
            console.log(`Tên phim: ${movie.title}`);
            console.log(`Trạng thái: ${movie.status}`);
            console.log(`Trailer hiện tại: ${movie.trailer || "Chưa có"}`);
        });

        console.log("\n======================================");
        console.log("          KIỂM TRA HOÀN TẤT");
        console.log("======================================");

    } catch (error) {
        console.error("\nLỖI:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

listMovies();
