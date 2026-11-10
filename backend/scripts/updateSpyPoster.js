require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const Movie = require("../models/Movie");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await Movie.updateOne(
    { slug: "spy-x-family-code-white" },
    {
      $set: {
        poster: "https://spy-family.net/codewhite/assets/img/top/gallery_visual_19.jpg"
      }
    }
  );

  console.log("So phim tim thay:", result.matchedCount);
  console.log("So phim cap nhat:", result.modifiedCount);

  const movie = await Movie.findOne(
    { slug: "spy-x-family-code-white" }
  ).select("title poster");

  console.log(movie);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("LOI:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
