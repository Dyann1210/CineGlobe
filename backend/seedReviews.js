
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/database");

const User = require("./models/User");
const Movie = require("./models/Movie");
const Review = require("./models/Review");

const seedReviews = async () => {
    try {
        await connectDB();

        const users = await User.find({});
        const movies = await Movie.find({});

        if (users.length === 0) {
            throw new Error("Chưa có tài khoản trong collection users!");
        }

        if (movies.length === 0) {
            throw new Error("Chưa có phim trong collection movies!");
        }

        const comments = [
            "Phim có nội dung rất hấp dẫn, hình ảnh đẹp và âm thanh sống động.",
            "Diễn viên diễn xuất tốt, cốt truyện lôi cuốn từ đầu đến cuối.",
            "Trải nghiệm xem phim tuyệt vời, rất đáng để ra rạp.",
            "Phim có nhiều cảnh quay ấn tượng, mình rất thích bộ phim này."
        ];

        const operations = movies.map((movie, index) => {
            const user = users[index % users.length];

            return {
                updateOne: {
                    filter: {
                        user: user._id,
                        movie: movie._id
                    },
                    update: {
                        $set: {
                            user: user._id,
                            movie: movie._id,
                            rating: [5, 4, 5, 4][index % 4],
                            comment: comments[index % comments.length],
                            isApproved: true,
                            isEdited: false
                        }
                    },
                    upsert: true
                }
            };
        });

        const result = await Review.bulkWrite(operations);

        console.log("=================================");
        console.log("TẠO ĐÁNH GIÁ PHIM THÀNH CÔNG!");
        console.log("Tài khoản:", users.length);
        console.log("Phim:", movies.length);
        console.log("Tạo mới:", result.upsertedCount);
        console.log("Cập nhật:", result.modifiedCount);
        console.log("=================================");

    } catch (error) {
        console.error("LỖI TẠO ĐÁNH GIÁ:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedReviews();
