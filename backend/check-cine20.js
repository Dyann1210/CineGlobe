require("dotenv").config();
const mongoose = require("mongoose");
const Promotion = require("./models/Promotion");

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

    const promotion = await Promotion.findOne({ code: "CINE20" }).lean();

    console.log("\n===== THONG TIN CINE20 =====");
    console.log(promotion || "KHONG TIM THAY MA CINE20");

    await mongoose.disconnect();
}

run().catch(console.error);
