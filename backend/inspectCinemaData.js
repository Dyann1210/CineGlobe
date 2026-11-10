const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const mongoose = require("mongoose");
const Cinema = require("./models/Cinema");
const Room = require("./models/Room");
const Seat = require("./models/Seat");
const Showtime = require("./models/Showtime");

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const cinemas = await Cinema.find({}).lean();

    console.log("\n===== DANH SACH RAP CINEGLOBE =====");

    for (const c of cinemas) {
        console.log("\nRAP:", c.name);
        console.log("DIA CHI:", c.address);
        console.log("THANH PHO:", c.city);
        console.log("QUAN/HUYEN:", c.district);

        const rooms = await Room.find({
            cinema: c._id,
            isActive: true
        }).lean();

        for (const r of rooms) {
            const seats = await Seat.countDocuments({
                room: r._id,
                isActive: true
            });

            console.log(
                "PHONG:", r.name,
                "| LOAI:", r.roomType,
                "| GHE:", seats
            );
        }

        console.log(
            "SUAT CHIEU:",
            await Showtime.countDocuments({ cinema: c._id })
        );
    }

    console.log("\n===== TONG KET =====");
    console.log("Tong rap:", cinemas.length);
    console.log("Tong phong:", await Room.countDocuments());
    console.log("Tong ghe:", await Seat.countDocuments());
    console.log("Tong suat:", await Showtime.countDocuments());
}

run()
    .catch(e => console.log("LOI:", e.message))
    .finally(() => mongoose.disconnect());
