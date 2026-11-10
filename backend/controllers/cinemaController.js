
const Cinema = require("../models/Cinema");

// LẤY DANH SÁCH RẠP
const getCinemas = async (req, res) => {
    try {
        const { city, search } = req.query;

        const filter = {
            isActive: true
        };

        if (city) {
            filter.city = {
                $regex: city,
                $options: "i"
            };
        }

        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }

        const cinemas = await Cinema.find(filter)
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            total: cinemas.length,
            cinemas
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách rạp.",
            error: error.message
        });
    }
};

// LẤY CHI TIẾT RẠP
const getCinemaById = async (req, res) => {
    try {
        const cinema = await Cinema.findOne({
            _id: req.params.id,
            isActive: true
        });

        if (!cinema) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy rạp chiếu phim."
            });
        }

        return res.status(200).json({
            success: true,
            cinema
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin rạp.",
            error: error.message
        });
    }
};

// LẤY DANH SÁCH THÀNH PHỐ CÓ RẠP
const getCinemaCities = async (req, res) => {
    try {
        const cities = await Cinema.distinct("city", {
            isActive: true
        });

        return res.status(200).json({
            success: true,
            cities
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách thành phố.",
            error: error.message
        });
    }
};

module.exports = {
    getCinemas,
    getCinemaById,
    getCinemaCities
};
