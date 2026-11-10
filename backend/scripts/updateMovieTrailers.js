
const path = require("path");
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const mongoose = require("mongoose");
const Movie = require("../models/Movie");

// Danh sách trailer theo đúng tên phim trong MongoDB
const trailerData = {
    "Black Clover: Sword of the Wizard King":
        "https://www.youtube.com/watch?v=M-JD8QqStBg",

    "Demon Slayer: Kimetsu no Yaiba Infinity Castle":
        "https://www.youtube.com/watch?v=9kb7vK11_Rw",

    "Jujutsu Kaisen 0":
        "https://www.youtube.com/watch?v=h3YKB_XWcb4",

    "My Hero Academia: You're Next":
        "https://www.youtube.com/watch?v=X_r-M3coFe4",

    "One Piece Film: Red":
        "https://www.youtube.com/watch?v=SoUURJRdurE",

    "SPY x FAMILY CODE: White":
        "https://www.youtube.com/watch?v=m5TxWbtQ7qU",

    "Solo Leveling: ReAwakening":
        "https://www.youtube.com/watch?v=BIBXA1Tpp8U",

    "The Last: Naruto the Movie":
        "https://www.youtube.com/watch?v=qDAwcE-skX0",

    "Avengers: Endgame":
        "https://www.youtube.com/watch?v=TcMBFSGVi1c",

    "Dune: Part Two":
        "https://www.youtube.com/watch?v=Way9Dexny3w",

    "Interstellar":
        "https://www.youtube.com/watch?v=2LqzF5WauAw",

    "The Batman":
        "https://www.youtube.com/watch?v=mqqft2x_Aa4"
};

async function updateMovieTrailers() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("Không tìm thấy MONGODB_URI trong backend/.env");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("\n======================================");
        console.log("       CẬP NHẬT TRAILER CINEGLOBE");
        console.log("======================================");

        const movies = await Movie.find({
            status: {
                $in: ["now_showing", "coming_soon"]
            }
        }).select("_id title status trailer");

        let updatedCount = 0;
        let skippedCount = 0;

        for (const movie of movies) {
            const trailerUrl = trailerData[movie.title];

            if (!trailerUrl) {
                console.log(`\n[SKIP] Không có trailer: ${movie.title}`);
                skippedCount++;
                continue;
            }

            // Chỉ cập nhật trường trailer, không sửa các trường khác
            const result = await Movie.updateOne(
                { _id: movie._id },
                {
                    $set: {
                        trailer: trailerUrl
                    }
                }
            );

            if (result.modifiedCount > 0 || movie.trailer === trailerUrl) {
                console.log(`\n[OK] ${movie.title}`);
                console.log(`Trailer: ${trailerUrl}`);
                updatedCount++;
            } else {
                console.log(`\n[ERROR] Không cập nhật được: ${movie.title}`);
                skippedCount++;
            }
        }

        console.log("\n======================================");
        console.log("             KẾT QUẢ");
        console.log("======================================");
        console.log(`Tổng số phim tìm thấy: ${movies.length}`);
        console.log(`Số phim có trailer: ${updatedCount}`);
        console.log(`Số phim bỏ qua/lỗi: ${skippedCount}`);
        console.log("======================================");

    } catch (error) {
        console.error("\nLỖI CẬP NHẬT:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\nĐã đóng kết nối MongoDB.");
    }
}

updateMovieTrailers();
