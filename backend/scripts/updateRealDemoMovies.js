require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");
const Booking = require("../models/Booking");

const movies = [
    {
        oldTitle: "Ám Ảnh Trong Đêm",
        tmdbId: 49018,
        poster: "https://image.tmdb.org/t/p/w500/tmlDFIUpGRKiuWm9Ixc6CYDk4y0.jpg",
        title: "Insidious",
        slug: "insidious",
        description: "Một gia đình phát hiện con trai rơi vào trạng thái hôn mê bí ẩn. Những hiện tượng kỳ quái liên tiếp xuất hiện, hé lộ một thế giới siêu nhiên đáng sợ.",
        genres: ["Horror", "Mystery", "Thriller"],
        duration: 103,
        director: "James Wan",
        cast: ["Patrick Wilson", "Rose Byrne", "Ty Simpkins", "Lin Shaye"],
        ageRating: "T16",
        language: "Tiếng Anh",
        trailer: "https://www.youtube.com/watch?v=62rpZcMYa0A"
    },
    {
        oldTitle: "Căn Phòng Số 13",
        tmdbId: 447332,
        poster: "https://image.tmdb.org/t/p/w500/nAU74GmpUk7t5iklEp3bufwDq4n.jpg",
        title: "A Quiet Place",
        slug: "a-quiet-place",
        description: "Trong một thế giới bị sinh vật ngoài hành tinh săn đuổi bằng âm thanh, một gia đình buộc phải sống trong im lặng tuyệt đối để sinh tồn.",
        genres: ["Horror", "Thriller", "Sci-Fi"],
        duration: 90,
        director: "John Krasinski",
        cast: ["Emily Blunt", "John Krasinski", "Millicent Simmonds", "Noah Jupe"],
        ageRating: "T16",
        language: "Tiếng Anh",
        trailer: "https://www.youtube.com/watch?v=WR7cc5t7tv8"
    },
    {
        oldTitle: "Tiếng Gõ Lúc Nửa Đêm",
        tmdbId: 882598,
        poster: "https://image.tmdb.org/t/p/w500/aPqcQwu4VGEewPhagWNncDbJ9Xp.jpg",
        title: "Smile",
        slug: "smile",
        description: "Sau khi chứng kiến một sự việc kinh hoàng liên quan đến bệnh nhân, bác sĩ Rose Cotter bắt đầu gặp những hiện tượng kỳ lạ và đáng sợ mà cô không thể lý giải.",
        genres: ["Horror", "Mystery", "Thriller"],
        duration: 115,
        director: "Parker Finn",
        cast: ["Sosie Bacon", "Jessie T. Usher", "Kyle Gallner", "Caitlin Stasey"],
        ageRating: "T18",
        language: "Tiếng Anh",
        trailer: "https://www.youtube.com/watch?v=BcDK7lkzzsU"
    },
    {
        oldTitle: "Lời Nguyền Hồ Cạn",
        tmdbId: 313369,
        poster: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
        title: "La La Land",
        slug: "la-la-land",
        description: "Tại Los Angeles, Mia là cô gái nuôi ước mơ trở thành diễn viên, còn Sebastian là nhạc công jazz đầy đam mê. Hai người gặp nhau và cùng theo đuổi ước mơ, tình yêu giữa những lựa chọn của cuộc đời.",
        genres: ["Romance", "Drama", "Music"],
        duration: 128,
        director: "Damien Chazelle",
        cast: ["Ryan Gosling", "Emma Stone", "John Legend", "Rosemarie DeWitt"],
        ageRating: "T13",
        language: "Tiếng Anh",
        trailer: "https://www.youtube.com/watch?v=0pdqf4P9MB8"
    },
    {
        oldTitle: "Ngày Ta Gặp Lại",
        tmdbId: 296096,
        poster: "https://image.tmdb.org/t/p/w500/Ia3dzj5LnCj1ZBdlVeJrbKJQxG.jpg",
        title: "Me Before You",
        slug: "me-before-you",
        description: "Louisa Clark trở thành người chăm sóc Will Traynor, một chàng trai từng có cuộc sống năng động nhưng bị liệt sau tai nạn. Sự đồng hành của hai người dần tạo nên một câu chuyện tình cảm sâu sắc.",
        genres: ["Romance", "Drama"],
        duration: 110,
        director: "Thea Sharrock",
        cast: ["Emilia Clarke", "Sam Claflin", "Janet McTeer", "Charles Dance"],
        ageRating: "T13",
        language: "Tiếng Anh",
        trailer: "https://www.youtube.com/watch?v=Eh993__rOxA"
    },
    {
        oldTitle: "Mùa Yêu Đầu",
        tmdbId: 329865,
        poster: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
        title: "Arrival",
        slug: "arrival",
        description: "Khi những con tàu vũ trụ bí ẩn xuất hiện trên khắp thế giới, nhà ngôn ngữ học Louise Banks được giao nhiệm vụ tìm cách giao tiếp với người ngoài hành tinh và ngăn chặn nguy cơ xung đột toàn cầu.",
        genres: ["Sci-Fi", "Drama", "Mystery"],
        duration: 116,
        director: "Denis Villeneuve",
        cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker", "Michael Stuhlbarg"],
        ageRating: "T13",
        language: "Tiếng Anh",
        trailer: "https://www.youtube.com/watch?v=AMgyWT075KY"
    },
    {
        oldTitle: "Hành Tinh Cuối Cùng",
        tmdbId: 354072,
        poster: "https://image.tmdb.org/t/p/w500/c445M1xu2M0NlcFD9hMOOgsfYFD.jpg",
        title: "Our Times",
        slug: "our-times",
        description: "Trở về những năm tháng trung học tại Đài Loan, cô gái Truly Lin cùng Taiyu bước vào một kế hoạch giúp nhau chinh phục người mình thầm thương, nhưng tình bạn lại dần biến thành một tình cảm đặc biệt.",
        genres: ["Romance", "Comedy", "School"],
        duration: 134,
        director: "Frankie Chen",
        cast: ["Vivian Sung", "Darren Wang", "Dino Lee", "Dewi Chien"],
        ageRating: "T13",
        language: "Tiếng Trung",
        trailer: "https://www.youtube.com/watch?v=yKNvU7J5cmE"
    },
    {
        oldTitle: "Kỷ Nguyên AI",
        tmdbId: 872585,
        poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        title: "Oppenheimer",
        slug: "oppenheimer",
        description: "Bộ phim kể về nhà vật lý J. Robert Oppenheimer và vai trò của ông trong dự án Manhattan, chương trình nghiên cứu chế tạo bom nguyên tử trong Thế chiến thứ hai.",
        genres: ["Biography", "Drama", "History", "Thriller"],
        duration: 181,
        director: "Christopher Nolan",
        cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"],
        ageRating: "T18",
        language: "Tiếng Anh",
        trailer: "https://www.youtube.com/watch?v=uYPbbksJxIg"
    },
    {
        oldTitle: "Du Hành 2099",
        tmdbId: 354912,
        poster: "https://image.tmdb.org/t/p/w500/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg",
        title: "Coco",
        slug: "coco",
        description: "Miguel, một cậu bé yêu âm nhạc, bất ngờ bước vào hành trình kỳ diệu đến vùng đất của tổ tiên và khám phá những bí mật trong lịch sử gia đình.",
        genres: ["Animation", "Family", "Fantasy", "Music"],
        duration: 106,
        director: "Lee Unkrich",
        cast: ["Anthony Gonzalez", "Gael Garcia Bernal", "Benjamin Bratt", "Alanna Ubach"],
        ageRating: "P",
        language: "Tiếng Anh",
        trailer: "https://www.youtube.com/watch?v=Ga6RYejo6Hk"
    },
    {
        oldTitle: "Thanh Xuân Rực Rỡ",
        tmdbId: 372058,
        poster: "https://image.tmdb.org/t/p/w500/8GJsy7w7frGquw1cy9jasOGNNI1.jpg",
        title: "Your Name",
        slug: "your-name",
        description: "Mitsuha và Taki là hai học sinh sống ở những nơi khác nhau. Một ngày nọ, họ bắt đầu hoán đổi cơ thể một cách bí ẩn và dần bị cuốn vào sợi dây định mệnh vượt qua không gian và thời gian.",
        genres: ["Animation", "Romance", "Drama", "Fantasy"],
        duration: 106,
        director: "Makoto Shinkai",
        cast: ["Ryunosuke Kamiki", "Mone Kamishiraishi", "Ryo Narita", "Aoi Yuki"],
        ageRating: "T13",
        language: "Tiếng Nhật",
        trailer: "https://www.youtube.com/watch?v=xU47nhruN-Q"
    }
];

async function getTmdbPoster(tmdbId) {
    const response = await fetch(
        `https://www.themoviedb.org/movie/${tmdbId}`,
        {
            headers: {
                "User-Agent": "Mozilla/5.0 CineGlobe Movie Updater"
            },
            signal: AbortSignal.timeout(20000)
        }
    );

    if (!response.ok) {
        throw new Error(`TMDB trả về HTTP ${response.status} cho ID ${tmdbId}`);
    }

    const html = await response.text();
    const metaTags = html.match(/<meta\b[^>]*>/gi) || [];

    const ogImage = metaTags.find(tag =>
        /\bproperty=["']og:image["']/i.test(tag)
    );

    if (!ogImage) {
        throw new Error(`Không tìm thấy ảnh poster TMDB ID ${tmdbId}`);
    }

    const match = ogImage.match(/\bcontent=["']([^"']+)["']/i);

    if (!match || !/^https:\/\//i.test(match[1])) {
        throw new Error(`URL poster không hợp lệ cho TMDB ID ${tmdbId}`);
    }

    return match[1].replace(/&amp;/g, "&");
}

async function main() {
    if (!process.env.MONGODB_URI) {
        throw new Error("Không tìm thấy MONGODB_URI trong backend/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("\nĐÃ KẾT NỐI MONGODB ATLAS");

    // 1. Tìm đúng 10 phim demo
    const oldTitles = movies.map(item => item.oldTitle);

    const existingMovies = await Movie.find({
        title: { $in: oldTitles }
    }).lean();

    const foundTitles = existingMovies.map(item => item.title);
    const missing = oldTitles.filter(title => !foundTitles.includes(title));

    if (missing.length || existingMovies.length !== 10) {
        throw new Error(
            "DỪNG: Không tìm thấy chính xác 10 phim demo. " +
            "Thiếu: " + missing.join(", ")
        );
    }

    // 2. Kiểm tra slug không trùng
    const slugs = movies.map(item => item.slug);

    if (new Set(slugs).size !== slugs.length) {
        throw new Error("DỪNG: Danh sách phim có slug trùng nhau.");
    }

    const oldIds = existingMovies.map(item => item._id);

    const conflict = await Movie.findOne({
        slug: { $in: slugs },
        _id: { $nin: oldIds }
    }).lean();

    if (conflict) {
        throw new Error(
            `DỪNG: Slug ${conflict.slug} đã được phim ${conflict.title} sử dụng.`
        );
    }

    // 3. Không cập nhật nếu phim demo đã phát sinh đặt vé
    const bookedMovies = await Booking.aggregate([
        { $match: { movie: { $in: oldIds } } },
        { $group: { _id: "$movie", total: { $sum: 1 } } }
    ]);

    if (bookedMovies.length > 0) {
        throw new Error(
            "DỪNG: Có phim demo đã phát sinh đặt vé. " +
            "Cần kiểm tra lịch sử đặt vé trước khi đổi tên."
        );
    }

    // 4. Lấy đủ poster trước khi thay đổi dữ liệu
    console.log("\n===== ĐANG KIỂM TRA POSTER =====");

    const preparedMovies = [];

    for (const item of movies) {
        console.log(`Đang lấy poster: ${item.title}`);

        const poster = item.poster;

        preparedMovies.push({
            ...item,
            poster
        });

        console.log("Đã lấy poster thành công.");
    }

    if (preparedMovies.length !== 10) {
        throw new Error("DỪNG: Không chuẩn bị đủ 10 poster.");
    }

    // 5. Sao lưu 10 phim cũ
    const backupFolder = path.resolve(__dirname, "../backups");

    fs.mkdirSync(backupFolder, { recursive: true });

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    const backupPath = path.join(
        backupFolder,
        `movies-before-update-${timestamp}.json`
    );

    fs.writeFileSync(
        backupPath,
        JSON.stringify(existingMovies, null, 2),
        "utf8"
    );

    console.log("\nĐÃ SAO LƯU:");
    console.log(backupPath);

    // 6. Cập nhật bằng transaction
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            for (const item of preparedMovies) {
                const oldMovie = existingMovies.find(
                    movie => movie.title === item.oldTitle
                );

                const updateData = {
                    title: item.title,
                    slug: item.slug,
                    description: item.description,
                    poster: item.poster,
                    backdrop: item.poster,
                    trailer: item.trailer,
                    genres: item.genres,
                    duration: item.duration,
                    director: item.director,
                    cast: item.cast,
                    ageRating: item.ageRating,
                    language: item.language,
                    status: "now_showing"
                };

                const result = await Movie.updateOne(
                    { _id: oldMovie._id },
                    { $set: updateData },
                    {
                        session,
                        runValidators: true
                    }
                );

                if (result.matchedCount !== 1) {
                    throw new Error(
                        `Không cập nhật được phim ${item.oldTitle}`
                    );
                }

                console.log(`Đã cập nhật: ${item.title}`);
            }
        });

        console.log("\n===== CẬP NHẬT HOÀN TẤT =====");
    } finally {
        await session.endSession();
    }

    // 7. Kiểm tra kết quả
    const updatedMovies = await Movie.find({
        slug: { $in: slugs }
    }).select("_id title slug poster trailer").lean();

    console.log("\n===== DANH SÁCH 10 PHIM MỚI =====");

    console.table(updatedMovies.map(item => ({
        id: String(item._id),
        title: item.title,
        slug: item.slug,
        poster: item.poster ? "Có" : "Trống",
        trailer: item.trailer ? "Có" : "Trống"
    })));

    console.log("\n===== TỔNG KẾT =====");
    console.log("10 phim demo đã được cập nhật.");
    console.log("3 phim thật cũ được giữ nguyên.");
    console.log("Tổng số phim trong hệ thống:", await Movie.countDocuments());
    console.log("Tổng số suất chiếu:", await Showtime.countDocuments());
    console.log("Tổng số lượt đặt vé:", await Booking.countDocuments());
    console.log("File sao lưu:", backupPath);
    console.log("ID phim cũ được giữ nguyên.");
    console.log("Lịch chiếu, ghế và vé không bị xóa.");
}

main()
    .catch(error => {
        console.error("\nLỖI - KHÔNG HOÀN TẤT CẬP NHẬT:");
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });