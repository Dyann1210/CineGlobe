
const Movie = require("../models/Movie");
const syncMovieRating = require("../utils/syncMovieRating");

// LẤY DANH SÁCH PHIM
const getMovies = async (req, res) => {
    try {
        const { status, genre, search } = req.query;

        const filter = {};

        // Lọc phim theo trạng thái
        if (status) {
            filter.status = status;
        }

        // Lọc phim theo thể loại
        if (genre) {
            filter.genres = {
                $in: [new RegExp(genre, "i")]
            };
        }

        // Tìm kiếm theo tên phim
        if (search) {
            filter.title = {
                $regex: search,
                $options: "i"
            };
        }

        const movies = await Movie.find(filter)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            total: movies.length,
            movies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách phim.",
            error: error.message
        });
    }
};

// LẤY CHI TIẾT PHIM
const getMovieById = async (req, res) => {
    try {
        await syncMovieRating(req.params.id);

        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phim."
            });
        }

        return res.status(200).json({
            success: true,
            movie
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin phim.",
            error: error.message
        });
    }
};

// LẤY PHIM ĐANG CHIẾU
const getNowShowing = async (req, res) => {
    try {
        const movies = await Movie.find({
            status: "now_showing"
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            total: movies.length,
            movies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy phim đang chiếu.",
            error: error.message
        });
    }
};

// LẤY PHIM SẮP CHIẾU
const getComingSoon = async (req, res) => {
    try {
        const movies = await Movie.find({
            status: "coming_soon"
        }).sort({ releaseDate: 1 });

        return res.status(200).json({
            success: true,
            total: movies.length,
            movies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy phim sắp chiếu.",
            error: error.message
        });
    }
};

module.exports = {
    getMovies,
    getMovieById,
    getNowShowing,
    getComingSoon
};
