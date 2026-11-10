require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const Movie = require("./models/Movie");

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Da ket noi MongoDB Atlas!");

    const movies = await Movie.find({
        slug: {
            $in: [
                "the-conjuring",
                "insidious",
                "a-quiet-place",
                "smile",
                "la-la-land",
                "me-before-you",
                "interstellar",
                "dune-part-two",
                "arrival",
                "our-times"
            ]
        }
    }).select("_id title slug poster trailer").lean();

    console.log("\n===== PHIM DANG TRUNG SLUG =====");

    console.table(movies.map(m => ({
        id: String(m._id),
        title: m.title,
        slug: m.slug,
        poster: m.poster ? "Co" : "Trong",
        trailer: m.trailer ? "Co" : "Trong"
    })));
}

main()
    .catch(error => console.error("\nLOI:", error.message))
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
