const { GoogleGenAI } = require("@google/genai");

const Movie = require("../models/Movie");
const Cinema = require("../models/Cinema");
const Showtime = require("../models/Showtime");
const Promotion = require("../models/Promotion");
const Booking = require("../models/Booking");

const formatDate = (date) => {
    if (!date) return "ChÆ°a cáº­p nháº­t";

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh"
    }).format(new Date(date));
};

const getCinemaData = async () => {
    const cinemas = await Cinema.find({ isActive: true })
        .select("name address city district phone facilities")
        .limit(30)
        .lean();

    return cinemas;
};

const getMovieData = async () => {
    const movies = await Movie.find({
        status: { $in: ["now_showing", "coming_soon"] }
    })
        .select(
            "title description genres duration releaseDate language ageRating director cast status rating"
        )
        .limit(40)
        .lean();

    return movies;
};

const getShowtimeData = async () => {
    const showtimes = await Showtime.find({
        status: "scheduled",
        startTime: { $gte: new Date() }
    })
        .populate("movie", "title duration ageRating")
        .populate("cinema", "name address city")
        .populate("room", "name roomType")
        .sort({ startTime: 1 })
        .limit(60)
        .lean();

    return showtimes.map((item) => ({
        movie: item.movie?.title || "ChÆ°a cÃ³ thÃ´ng tin phim",
        cinema: item.cinema?.name || "ChÆ°a cÃ³ thÃ´ng tin ráº¡p",
        address: item.cinema?.address || "",
        city: item.cinema?.city || "",
        room: item.room?.name || "",
        roomType: item.room?.roomType || "",
        startTime: formatDate(item.startTime),
        endTime: formatDate(item.endTime),
        price: item.price,
        availableSeats: item.availableSeats,
        status: item.status
    }));
};

const getPromotionData = async () => {
    const now = new Date();

    const promotions = await Promotion.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    })
        .select(
            "name code description discountType discountValue maxDiscount minOrderAmount startDate endDate usageLimit usedCount"
        )
        .limit(20)
        .lean();

    return promotions;
};

const getMyBookings = async (userId) => {
    if (!userId) return [];

    const bookings = await Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("movie", "title")
        .populate("cinema", "name address")
        .populate("room", "name")
        .populate("showtime", "startTime")
        .lean();

    return bookings.map((booking) => ({
        bookingCode: booking.bookingCode,
        movie: booking.movie?.title || "KhÃ´ng rÃµ",
        cinema: booking.cinema?.name || "KhÃ´ng rÃµ",
        room: booking.room?.name || "KhÃ´ng rÃµ",
        showtime: formatDate(booking.showtime?.startTime),
        seats: (booking.seats || []).map((seat) => seat.seatNumber),
        totalAmount: booking.totalAmount,
        finalAmount: booking.finalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: formatDate(booking.createdAt)
    }));
};

exports.chatWithGlobeAI = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "MÃ¡y chá»§ chÆ°a cáº¥u hÃ¬nh Gemini API Key."
            });
        }

        const message = String(req.body.message || "").trim();

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Báº¡n hÃ£y nháº­p ná»™i dung cáº§n tÆ° váº¥n."
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Tin nháº¯n khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 2.000 kÃ½ tá»±."
            });
        }

        // Láº¥y dá»¯ liá»‡u thá»±c táº¿ tá»« MongoDB
        const [movies, cinemas, showtimes, promotions] =
            await Promise.all([
                getMovieData(),
                getCinemaData(),
                getShowtimeData(),
                getPromotionData()
            ]);

        // Chá»‰ láº¥y lá»‹ch sá»­ há»™i thoáº¡i há»£p lá»‡
        const history = Array.isArray(req.body.history)
            ? req.body.history.slice(-12).filter((item) =>
                ["user", "model"].includes(item.role) &&
                typeof item.text === "string"
            )
            : [];

        const conversation = history.map((item) => ({
            role: item.role,
            parts: [{ text: item.text.slice(0, 2000) }]
        }));

        // Láº¥y lá»‹ch sá»­ Ä‘áº·t vÃ© cá»§a chÃ­nh khÃ¡ch Ä‘ang Ä‘Äƒng nháº­p
        const myBookings = req.user
            ? await getMyBookings(req.user._id)
            : [];

        const databaseContext = {
            currentTime: formatDate(new Date()),
            loggedInUser: req.user
                ? {
                    fullName: req.user.fullName,
                    email: req.user.email,
                    role: req.user.role
                }
                : null,
            movies,
            cinemas,
            showtimes,
            activePromotions: promotions,
            myRecentBookings: myBookings
        };

        const systemInstruction = `
Báº¡n lÃ  Globe AI, trá»£ lÃ½ tÆ° váº¥n chÃ­nh thá»©c cá»§a CineGlobe - ná»n táº£ng Ä‘áº·t vÃ© xem phim.

QUY Táº®C GIAO TIáº¾P:
1. LuÃ´n giao tiáº¿p tá»± nhiÃªn, thÃ¢n thiá»‡n, lá»‹ch sá»± báº±ng tiáº¿ng Viá»‡t.
2. Khi khÃ¡ch vá»«a má»Ÿ chat, hÃ£y chÃ o khÃ¡ch vÃ  giá»›i thiá»‡u ngáº¯n gá»n kháº£ nÄƒng há»— trá»£.
3. Gá»i khÃ¡ch lÃ  "quÃ½ khÃ¡ch" hoáº·c xÆ°ng "mÃ¬nh" má»™t cÃ¡ch tá»± nhiÃªn.
4. Tráº£ lá»i Ä‘Ãºng trá»ng tÃ¢m, dá»… hiá»ƒu, trÃ¬nh bÃ y rÃµ rÃ ng.
5. CÃ³ thá»ƒ sá»­ dá»¥ng biá»ƒu tÆ°á»£ng cáº£m xÃºc vá»«a pháº£i.

QUY Táº®C Dá»® LIá»†U:
1. ThÃ´ng tin phim, ráº¡p, suáº¥t chiáº¿u, khuyáº¿n mÃ£i pháº£i dá»±a trÃªn dá»¯ liá»‡u MongoDB Ä‘Æ°á»£c cung cáº¥p.
2. Tuyá»‡t Ä‘á»‘i khÃ´ng tá»± táº¡o tÃªn phim, giá» chiáº¿u, giÃ¡ vÃ©, Ä‘á»‹a chá»‰ ráº¡p hoáº·c mÃ£ khuyáº¿n mÃ£i.
3. Náº¿u khÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u, hÃ£y nÃ³i rÃµ hiá»‡n chÆ°a cÃ³ thÃ´ng tin trong há»‡ thá»‘ng.
4. KhÃ´ng kháº³ng Ä‘á»‹nh má»™t suáº¥t chiáº¿u cÃ²n gháº¿ chá»‰ dá»±a vÃ o thÃ´ng tin cÅ©.
5. GiÃ¡ tiá»n hiá»ƒn thá»‹ theo Ä‘á»‹nh dáº¡ng VNÄ.
6. Thá»i gian trong dá»¯ liá»‡u sá»­ dá»¥ng mÃºi giá» Viá»‡t Nam.
7. Khi khÃ¡ch há»i vá» phim, cÃ³ thá»ƒ tÆ° váº¥n dá»±a trÃªn thá»ƒ loáº¡i, mÃ´ táº£, thá»i lÆ°á»£ng vÃ  Ä‘á»™ tuá»•i.

QUY Táº®C TÃ€I KHOáº¢N:
1. Chá»‰ sá»­ dá»¥ng dá»¯ liá»‡u myRecentBookings Ä‘á»ƒ tráº£ lá»i vá» vÃ© cá»§a tÃ i khoáº£n Ä‘ang Ä‘Äƒng nháº­p.
2. KhÃ´ng tiáº¿t lá»™ dá»¯ liá»‡u cá»§a khÃ¡ch hÃ ng khÃ¡c.
3. Náº¿u khÃ¡ch chÆ°a Ä‘Äƒng nháº­p vÃ  há»i vÃ© cá»§a tÃ´i, hÆ°á»›ng dáº«n khÃ¡ch Ä‘Äƒng nháº­p trÆ°á»›c.
4. KhÃ´ng nÃ³i ráº±ng Ä‘Ã£ Ä‘áº·t vÃ©, thanh toÃ¡n hoáº·c há»§y vÃ© thÃ nh cÃ´ng. Chatbot hiá»‡n chá»‰ cÃ³ chá»©c nÄƒng tÆ° váº¥n.

QUY Táº®C Äáº¶T VÃ‰:
1. CÃ³ thá»ƒ hÆ°á»›ng dáº«n khÃ¡ch chá»n phim, ráº¡p, suáº¥t chiáº¿u, gháº¿ vÃ  thanh toÃ¡n trÃªn website.
2. KhÃ´ng tá»± xÃ¡c nháº­n Ä‘áº·t vÃ© thay cho há»‡ thá»‘ng.
3. Náº¿u khÃ¡ch há»i giÃ¡ hoáº·c suáº¥t chiáº¿u, hÃ£y sá»­ dá»¥ng dá»¯ liá»‡u Ä‘Æ°á»£c cung cáº¥p.
4. Náº¿u thÃ´ng tin chÆ°a cÃ³, hÃ£y Ä‘á» nghá»‹ khÃ¡ch kiá»ƒm tra trá»±c tiáº¿p trÃªn trang Ä‘áº·t vÃ©.

Dá»® LIá»†U CINEGLOBE HIá»†N Táº I:
${JSON.stringify(databaseContext)}
`;

        const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta", httpOptions: { timeout: 30000 } });

        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: [
                ...conversation,
                {
                    role: "user",
                    parts: [{ text: message }]
                }
            ],
            config: {
                systemInstruction,
                temperature: 0.5,
                maxOutputTokens: 1200
            }
        });

        const reply = response.text?.trim();

        if (!reply) {
            throw new Error("Gemini khÃ´ng tráº£ vá» ná»™i dung.");
        }

        return res.json({
            success: true,
            reply
        });

    } catch (error) {
        console.error("Globe AI error:", error.message);

        if (
            error.status === 429 ||
            error.message?.includes("RESOURCE_EXHAUSTED")
        ) {
            return res.status(429).json({
                success: false,
                message: "Globe AI Ä‘ang cÃ³ nhiá»u yÃªu cáº§u. QuÃ½ khÃ¡ch vui lÃ²ng thá»­ láº¡i sau Ã­t phÃºt nhÃ©."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Globe AI hiá»‡n chÆ°a thá»ƒ tráº£ lá»i. QuÃ½ khÃ¡ch vui lÃ²ng thá»­ láº¡i sau."
        });
    }
};


