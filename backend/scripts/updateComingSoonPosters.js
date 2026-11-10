require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const Movie = require("../models/Movie");

const posters = [
  {
    slug: "demon-slayer-infinity-castle",
    poster: "https://image.tmdb.org/t/p/original/smw5t45QADc678jV5YR4mvSNnln.jpg"
  },
  {
    slug: "black-clover-sword-of-the-wizard-king",
    poster: "https://assets.gadgets360cdn.com/pricee/assets/product/202302/ENUS_BlackClover_Main_Vertical_RGB_PRE_1676356417.jpg"
  },
  {
    slug: "the-last-naruto-the-movie",
    poster: "https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak%3D/v3/t/assets/p11428092_p_v8_aa.jpg"
  },
  {
    slug: "jujutsu-kaisen-0",
    poster: "https://times-abema.ismcdn.jp/mwimgs/7/9/1448w/img_79db6f8f455bcc210576478ef218fd5f361794.jpg"
  },
  {
    slug: "one-piece-film-red",
    poster: "https://www.turksatkablonet.com/upload/medya/One_Piece_Film_Red_Poster_Visual_1.webp"
  },
  {
    slug: "my-hero-academia-youre-next",
    poster: "https://imgix.hoyts.com.au/mx/posters/nz/my-hero-academia-youre-next-subbed-87f15983.jpg"
  },
  {
    slug: "solo-leveling-reawakening",
    poster: "https://www.youthdaily.co.kr/data/photos/20241044/art_17300998712261_cdc3c3.jpg"
  },
  {
    slug: "spy-x-family-code-white",
    poster: "https://storage.moegirl.org.cn/moegirl/commons/f/f7/Spyfamily_Movie_KV.jpg"
  }
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const item of posters) {
    const result = await Movie.updateOne(
      { slug: item.slug },
      { $set: { poster: item.poster } }
    );

    console.log(
      result.matchedCount
        ? `DA CAP NHAT: ${item.slug}`
        : `KHONG TIM THAY: ${item.slug}`
    );
  }

  await mongoose.disconnect();
  console.log("\nHOAN TAT CAP NHAT POSTER!");
}

main().catch(async (error) => {
  console.error("LOI:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
