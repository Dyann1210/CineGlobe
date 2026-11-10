const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const mongoose = require("mongoose");
const Movie = require("./models/Movie");
const Cinema = require("./models/Cinema");
const Room = require("./models/Room");
const Seat = require("./models/Seat");
const Showtime = require("./models/Showtime");

const movieData = [
    {
        title: "Ám Ảnh Trong Đêm",
        description: "Một gia đình chuyển đến căn nhà cũ và liên tục nghe thấy những tiếng động kỳ lạ vào lúc nửa đêm.",
        genres: ["Kinh dị", "Bí ẩn"],
        duration: 110,
        releaseDate: "2026-11-10",
        director: "Nguyễn Minh Khang",
        cast: ["Trần Gia Huy", "Ngọc Anh", "Minh Quân"],
        ageRating: "T18"
    },
    {
        title: "Căn Phòng Số 13",
        description: "Một nhóm bạn vô tình mở cánh cửa căn phòng bị niêm phong và đánh thức bí mật kinh hoàng.",
        genres: ["Kinh dị", "Giật gân"],
        duration: 105,
        releaseDate: "2026-11-11",
        director: "Lê Hoàng Nam",
        cast: ["Bảo Ngọc", "Tuấn Anh", "Khánh Linh"],
        ageRating: "T18"
    },
    {
        title: "Tiếng Gõ Lúc Nửa Đêm",
        description: "Những tiếng gõ cửa xuất hiện mỗi đêm dù bên ngoài không có bất kỳ ai.",
        genres: ["Kinh dị", "Siêu nhiên"],
        duration: 115,
        releaseDate: "2026-11-12",
        director: "Trần Đức Anh",
        cast: ["Hoàng Long", "Mai Phương", "Thanh Tùng"],
        ageRating: "T18"
    },
    {
        title: "Lời Nguyền Hồ Cạn",
        description: "Một chuyến du lịch đến hồ nước bỏ hoang biến thành cuộc chạy trốn khỏi lời nguyền cổ xưa.",
        genres: ["Kinh dị", "Bí ẩn"],
        duration: 108,
        releaseDate: "2026-11-13",
        director: "Phạm Quốc Bảo",
        cast: ["Hải Yến", "Đức Thịnh", "Phương Anh"],
        ageRating: "T18"
    },
    {
        title: "Ngày Ta Gặp Lại",
        description: "Hai người từng bỏ lỡ nhau thời thanh xuân bất ngờ gặp lại và có cơ hội viết tiếp câu chuyện tình yêu.",
        genres: ["Tình cảm", "Lãng mạn"],
        duration: 112,
        releaseDate: "2026-11-14",
        director: "Nguyễn Hoàng",
        cast: ["Lan Ngọc", "Quang Tuấn", "Thu Trang"],
        ageRating: "T13"
    },
    {
        title: "Mùa Yêu Đầu",
        description: "Một câu chuyện tình nhẹ nhàng về những rung động đầu đời và lựa chọn của tuổi trẻ.",
        genres: ["Tình cảm", "Lãng mạn"],
        duration: 105,
        releaseDate: "2026-11-15",
        director: "Trần Nhật Minh",
        cast: ["Minh Tú", "Gia Bảo", "Khả Ngân"],
        ageRating: "T13"
    },
    {
        title: "Hành Tinh Cuối Cùng",
        description: "Phi hành đoàn thực hiện nhiệm vụ tìm kiếm nơi ở mới cho nhân loại sau khi Trái Đất đứng trước nguy cơ diệt vong.",
        genres: ["Viễn tưởng", "Phiêu lưu"],
        duration: 130,
        releaseDate: "2026-11-16",
        director: "James Carter",
        cast: ["Alex Morgan", "Emily Stone", "Daniel Lee"],
        ageRating: "T13"
    },
    {
        title: "Kỷ Nguyên AI",
        description: "Một trí tuệ nhân tạo vượt khỏi tầm kiểm soát và buộc con người phải đối mặt với tương lai của chính mình.",
        genres: ["Viễn tưởng", "Hành động"],
        duration: 122,
        releaseDate: "2026-11-17",
        director: "David Miller",
        cast: ["Chris Evans", "Lily James", "Mark Wilson"],
        ageRating: "T13"
    },
    {
        title: "Du Hành 2099",
        description: "Một nhà du hành xuyên thời gian phát hiện sự thật có thể thay đổi toàn bộ lịch sử nhân loại.",
        genres: ["Viễn tưởng", "Phiêu lưu"],
        duration: 125,
        releaseDate: "2026-11-18",
        director: "Michael Anderson",
        cast: ["Ryan Cole", "Sophia Brown", "Lucas White"],
        ageRating: "T13"
    },
    {
        title: "Thanh Xuân Rực Rỡ",
        description: "Những câu chuyện về tình bạn, tình yêu và ước mơ của nhóm học sinh cuối cấp trước ngưỡng cửa trưởng thành.",
        genres: ["Học đường", "Tình cảm"],
        duration: 100,
        releaseDate: "2026-11-19",
        director: "Nguyễn Thanh Bình",
        cast: ["Khánh Vy", "Minh Đức", "Hoàng Anh"],
        ageRating: "P"
    }
];

function slugify(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addDays(dateString, days) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));

    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0")
    ].join("-");
}

function localDate(dateString) {
    return new Date(`${dateString}T00:00:00+07:00`);
}

async function getOrCreateMovie(data) {
    let movie = await Movie.findOne({
        title: new RegExp(`^${escapeRegex(data.title)}$`, "i")
    });

    if (movie) {
        console.log("DA CO PHIM:", data.title);
        return { movie, created: false };
    }

    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let suffix = 2;

    while (await Movie.exists({ slug })) {
        slug = `${baseSlug}-${suffix++}`;
    }

    movie = await Movie.create({
        ...data,
        slug,
        poster: "",
        backdrop: "",
        trailer: "",
        language: "Tiếng Việt",
        status: "now_showing",
        rating: 0,
        reviewCount: 0,
        isFeatured: false
    });

    console.log("DA TAO PHIM:", movie.title);

    return { movie, created: true };
}

function getPrice(cinema, room) {
    const location = `${cinema.name} ${cinema.district}`.toLowerCase();

    if (location.includes("trảng bom")) return 65000;
    if (location.includes("sài gòn")) return 85000;

    return room.roomType === "vip" ? 100000 : 75000;
}

async function hasTimeConflict(roomId, startTime, endTime) {
    const buffer = 15 * 60 * 1000;

    return Showtime.exists({
        room: roomId,
        status: { $ne: "cancelled" },
        startTime: {
            $lt: new Date(endTime.getTime() + buffer)
        },
        endTime: {
            $gt: new Date(startTime.getTime() - buffer)
        }
    });
}

async function createShowtimes(movie, cinema, rooms, releaseDate) {
    let created = 0;
    const target = 2;
    const times = ["09:00", "12:00", "15:00", "18:00", "21:00"];

    const roomInfo = [];

    for (const room of rooms) {
        const seats = await Seat.countDocuments({
            room: room._id,
            isActive: true
        });

        if (seats > 0) {
            roomInfo.push({
                room,
                seats,
                load: await Showtime.countDocuments({
                    room: room._id,
                    status: { $ne: "cancelled" }
                })
            });
        }
    }

    if (roomInfo.length === 0) {
        console.log("  KHONG CO PHONG CO GHE:", cinema.name);
        return 0;
    }

    for (let day = 0; day < 7 && created < target; day++) {
        const dateString = addDays(releaseDate, day);

        for (const time of times) {
            if (created >= target) break;

            const [hour, minute] = time.split(":");
            const startTime = new Date(
                `${dateString}T${hour}:${minute}:00+07:00`
            );

            const endTime = new Date(
                startTime.getTime() + movie.duration * 60 * 1000
            );

            roomInfo.sort((a, b) => a.load - b.load);

            let selected = null;

            for (const info of roomInfo) {
                const conflict = await hasTimeConflict(
                    info.room._id,
                    startTime,
                    endTime
                );

                if (!conflict) {
                    selected = info;
                    break;
                }
            }

            if (!selected) continue;

            await Showtime.create({
                movie: movie._id,
                cinema: cinema._id,
                room: selected.room._id,
                startTime,
                endTime,
                date: localDate(dateString),
                price: getPrice(cinema, selected.room),
                status: "scheduled",
                availableSeats: selected.seats
            });

            selected.load++;
            created++;

            console.log(
                `  + ${cinema.name} | ${selected.room.name} | ` +
                `${dateString} ${time} | ${selected.seats} ghe`
            );
        }
    }

    if (created < target) {
        console.log(
            `  CHI TAO DUOC ${created}/${target} SUAT CHO ${movie.title}`
        );
    }

    return created;
}

async function main() {
    if (!process.env.MONGODB_URI) {
        throw new Error("Khong tim thay MONGODB_URI trong backend/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("\n==================================");
    console.log("CINEGLOBE - TAO DU LIEU DEMO");
    console.log("Database:", mongoose.connection.name);
    console.log("==================================");

    const cinemas = await Cinema.find({ isActive: true });

    if (cinemas.length === 0) {
        throw new Error("Khong tim thay rap dang hoat dong.");
    }

    const cinemaRooms = [];

    for (const cinema of cinemas) {
        const rooms = await Room.find({
            cinema: cinema._id,
            isActive: true
        });

        if (rooms.length === 0) {
            console.log("CANH BAO: Rap khong co phong:", cinema.name);
            continue;
        }

        cinemaRooms.push({ cinema, rooms });
    }

    if (cinemaRooms.length === 0) {
        throw new Error("Khong co phong chieu hoat dong.");
    }

    console.log("\nSo rap se phan bo:", cinemaRooms.length);

    let newMovies = 0;
    let totalShowtimes = 0;
    const summary = [];

    for (const data of movieData) {
        console.log(`\n===== ${data.title} =====`);

        const result = await getOrCreateMovie(data);

        if (result.created) newMovies++;

        let movieShowtimes = 0;

        for (const item of cinemaRooms) {
            const count = await createShowtimes(
                result.movie,
                item.cinema,
                item.rooms,
                data.releaseDate
            );

            movieShowtimes += count;
            totalShowtimes += count;
        }

        summary.push({
            title: data.title,
            genres: data.genres.join(", "),
            releaseDate: data.releaseDate,
            showtimes: movieShowtimes
        });
    }

    console.log("\n==================================");
    console.log("KET QUA TAO DU LIEU");
    console.log("==================================");
    console.log("Phim moi tao:", newMovies);
    console.log("So rap:", cinemaRooms.length);
    console.log("So suat chieu moi:", totalShowtimes);

    console.log("\n===== TONG HOP THEO PHIM =====");

    for (const item of summary) {
        console.log(
            `${item.title} | ${item.genres} | ` +
            `${item.releaseDate} | ${item.showtimes} suat`
        );
    }

    console.log("\n===== TONG SUAT CHIEU THEO RAP =====");

    for (const item of cinemaRooms) {
        const count = await Showtime.countDocuments({
            cinema: item.cinema._id
        });

        console.log(`${item.cinema.name}: ${count} suat tong cong`);
    }

    console.log("\nHOAN TAT!");
}

main()
    .catch(error => {
        console.error("\nLOI:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
