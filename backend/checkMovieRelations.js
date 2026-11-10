require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const Movie = require("./models/Movie");
const Showtime = require("./models/Showtime");
const Booking = require("./models/Booking");

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("\n===== KIEM TRA LIEN KET PHIM =====");

    const movies = await Movie.find({}).select("_id title slug").lean();

    for (const movie of movies) {
        const showtimeCount = await Showtime.countDocuments({
            movie: movie._id
        });

        const bookingCount = await Booking.countDocuments({
            movie: movie._id
        });

        if (
            showtimeCount > 0 ||
            bookingCount > 0 ||
            [
                "Dune: Part Two",
                "Interstellar",
                "The Conjuring"
            ].includes(movie.title)
        ) {
            console.log({
                id: String(movie._id),
                title: movie.title,
                slug: movie.slug,
                showtimes: showtimeCount,
                bookings: bookingCount
            });
        }
    }

    console.log("\n===== TONG KET =====");
    console.log("Tong phim:", movies.length);
    console.log("Tong suat chieu:", await Showtime.countDocuments());
    console.log("Tong dat ve:", await Booking.countDocuments());
}

main()
    .catch(error => console.error("LOI:", error.message))
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
