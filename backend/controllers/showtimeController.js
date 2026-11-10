
const Showtime = require("../models/Showtime");

// LẤY DANH SÁCH LỊCH CHIẾU
const getShowtimes = async (req, res) => {
    try {
        const { movieId, cinemaId, date } = req.query;

        const filter = {
            status: "scheduled",
            startTime: { $gte: new Date() }
        };

        if (movieId) {
            filter.movie = movieId;
        }

        if (cinemaId) {
            filter.cinema = cinemaId;
        }

        if (date) {
            const startDate = new Date(`${date}T00:00:00.000Z`);
            const endDate = new Date(`${date}T23:59:59.999Z`);

            if (
                Number.isNaN(startDate.getTime()) ||
                Number.isNaN(endDate.getTime())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Ngày chiếu không hợp lệ."
                });
            }

            filter.startTime = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const showtimes = await Showtime.find(filter)
            .populate("movie", "title poster duration ageRating")
            .populate("cinema", "name address city")
            .populate("room", "name roomType")
            .sort({ startTime: 1 });

        return res.status(200).json({
            success: true,
            total: showtimes.length,
            showtimes
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách lịch chiếu.",
            error: error.message
        });
    }
};

// LẤY CHI TIẾT SUẤT CHIẾU
const getShowtimeById = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate("movie")
            .populate("cinema")
            .populate("room");

        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy suất chiếu."
            });
        }

        return res.status(200).json({
            success: true,
            showtime
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin suất chiếu.",
            error: error.message
        });
    }
};

// LẤY LỊCH CHIẾU THEO PHIM
const getShowtimesByMovie = async (req, res) => {
    try {
        const showtimes = await Showtime.find({
            movie: req.params.movieId,
            status: "scheduled",
            startTime: { $gte: new Date() }
        })
            .populate("cinema", "name address city")
            .populate("room", "name roomType")
            .sort({ startTime: 1 });

        return res.status(200).json({
            success: true,
            total: showtimes.length,
            showtimes
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy lịch chiếu của phim.",
            error: error.message
        });
    }
};

module.exports = {
    getShowtimes,
    getShowtimeById,
    getShowtimesByMovie
};
