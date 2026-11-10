require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/database");
const Movie = require("../models/Movie");

const movies = [
    {
        title: "Demon Slayer: Kimetsu no Yaiba Infinity Castle",
        slug: "demon-slayer-infinity-castle",
        description: "Tanjiro cùng các Trụ Cột bước vào Vô Hạn Thành, nơi trận chiến quyết định với Muzan và các Thượng Huyền bắt đầu.",
        poster: "https://image.tmdb.org/t/p/w500/aFRDH3P7TX61FVGpaLhKr6QiOC1.jpg",
        genres: ["Anime", "Hành động", "Phiêu lưu", "Giả tưởng"],
        duration: 155,
        language: "Tiếng Nhật",
        ageRating: "T16",
        director: "Haruo Sotozaki",
        cast: ["Natsuki Hanae", "Akari Kito", "Hiro Shimono"],
        status: "coming_soon",
        rating: 0,
        isFeatured: true
    },
    {
        title: "Black Clover: Sword of the Wizard King",
        slug: "black-clover-sword-of-the-wizard-king",
        description: "Asta và những người bạn đối mặt với thử thách mới, nơi ý chí và sức mạnh quyết định tương lai của Vương quốc Clover.",
        genres: ["Anime", "Hành động", "Phiêu lưu", "Giả tưởng"],
        duration: 113,
        language: "Tiếng Nhật",
        ageRating: "T13",
        director: "Ayataka Tanemura",
        cast: ["Gakuto Kajiwara", "Nobunaga Shimazaki"],
        status: "coming_soon",
        rating: 0
    },
    {
        title: "The Last: Naruto the Movie",
        slug: "the-last-naruto-the-movie",
        description: "Naruto bước vào nhiệm vụ đặc biệt để giải cứu Hinata và bảo vệ thế giới trước một mối đe dọa mới.",
        genres: ["Anime", "Hành động", "Phiêu lưu", "Tình cảm"],
        duration: 112,
        language: "Tiếng Nhật",
        ageRating: "T13",
        director: "Tsuneo Kobayashi",
        cast: ["Junko Takeuchi", "Nana Mizuki", "Chie Nakamura"],
        status: "coming_soon",
        rating: 0
    },
    {
        title: "Jujutsu Kaisen 0",
        slug: "jujutsu-kaisen-0",
        description: "Yuta Okkotsu bước vào thế giới chú thuật, đối mặt với lời nguyền mạnh mẽ gắn liền với người bạn thời thơ ấu.",
        genres: ["Anime", "Hành động", "Kinh dị", "Giả tưởng"],
        duration: 105,
        language: "Tiếng Nhật",
        ageRating: "T16",
        director: "Sunghoo Park",
        cast: ["Megumi Ogata", "Kana Hanazawa", "Yuichi Nakamura"],
        status: "coming_soon",
        rating: 0
    },
    {
        title: "One Piece Film: Red",
        slug: "one-piece-film-red",
        description: "Luffy và băng Mũ Rơm gặp Uta, nữ ca sĩ nổi tiếng với giọng hát có thể làm thay đổi thế giới.",
        genres: ["Anime", "Hành động", "Phiêu lưu", "Âm nhạc"],
        duration: 115,
        language: "Tiếng Nhật",
        ageRating: "T13",
        director: "Goro Taniguchi",
        cast: ["Mayumi Tanaka", "Kaori Nazuka", "Shuichi Ikeda"],
        status: "coming_soon",
        rating: 0
    },
    {
        title: "My Hero Academia: You're Next",
        slug: "my-hero-academia-youre-next",
        description: "Deku và lớp 1-A phải đối đầu với một kẻ thù bí ẩn có sức mạnh khiến cả xã hội anh hùng gặp nguy hiểm.",
        genres: ["Anime", "Hành động", "Siêu anh hùng"],
        duration: 110,
        language: "Tiếng Nhật",
        ageRating: "T13",
        director: "Tensai Okamura",
        cast: ["Daiki Yamashita", "Nobuhiko Okamoto"],
        status: "coming_soon",
        rating: 0
    },
    {
        title: "Solo Leveling: ReAwakening",
        slug: "solo-leveling-reawakening",
        description: "Theo chân Sung Jin-Woo trên hành trình trở thành thợ săn mạnh nhất, vượt qua những hầm ngục đầy nguy hiểm.",
        genres: ["Anime", "Hành động", "Giả tưởng", "Phiêu lưu"],
        duration: 119,
        language: "Tiếng Nhật",
        ageRating: "T16",
        director: "Shunsuke Nakashige",
        cast: ["Taito Ban", "Genta Nakamura"],
        status: "coming_soon",
        rating: 0
    },
    {
        title: "SPY x FAMILY CODE: White",
        slug: "spy-x-family-code-white",
        description: "Gia đình Forger bước vào chuyến phiêu lưu mùa đông đầy bất ngờ, nơi một nhiệm vụ tưởng chừng đơn giản trở nên hỗn loạn.",
        genres: ["Anime", "Hài", "Hành động", "Phiêu lưu"],
        duration: 110,
        language: "Tiếng Nhật",
        ageRating: "P",
        director: "Takashi Katagiri",
        cast: ["Takuya Eguchi", "Atsumi Tanezaki", "Saori Hayami"],
        status: "coming_soon",
        rating: 0
    }
];

async function seedComingSoonMovies() {
    try {
        console.log("\n===== CONNECT MONGODB ATLAS =====");
        await connectDB();

        console.log("\n===== INSERT / UPDATE COMING SOON =====");

        for (const movie of movies) {
            const result = await Movie.findOneAndUpdate(
                { slug: movie.slug },
                { $set: movie },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            );

            console.log("OK:", result.title, "|", result.status);
        }

        const total = await Movie.countDocuments({
            status: "coming_soon"
        });

        console.log("\n=================================");
        console.log("SEED COMPLETED!");
        console.log("Coming Soon movies in MongoDB:", total);
        console.log("=================================");

    } catch (error) {
        console.error("\nSEED ERROR:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedComingSoonMovies();
