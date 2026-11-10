require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Movie = require("./models/Movie");

async function checkMovies() {
    try {
        await connectDB();

        console.log("\n===== DANH SACH PHIM TRONG MONGODB =====");

        const movies = await Movie.find({})
            .select("_id title name slug status")
            .sort({ createdAt: -1 });

        console.table(movies.map((m, index) => ({
            STT: index + 1,
            ID: m._id.toString(),
            Title: m.title,
            Name: m.name,
            Slug: m.slug,
            Status: m.status
        })));

        console.log("\nTong so phim:", movies.length);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkMovies();
