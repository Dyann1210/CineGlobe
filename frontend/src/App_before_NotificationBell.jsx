
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Search, Bell, UserRound, Home, Film, Ticket,
  MessageCircle, ChevronRight, Play, Star, MapPin,
  Sparkles, CalendarDays, X, LogOut, LogIn,
  ShieldCheck
} from "lucide-react";

import AuthPage from "./AuthPage";
import BookingPage from "./BookingPage";
import MyTickets from "./MyTickets";
import ProfilePage from "./ProfilePage";
import MovieDetailPage from "./MovieDetailPage";
import GlobeAI from "./GlobeAI";
import AdminPage from "./AdminPage";
import "./App.css";

const API = "http://localhost:5000/api";

const fallbackMovies = [
  {
    _id: "1",
    title: "Dune: Part Two",
    poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    genres: ["Viễn tưởng", "Hành động"],
    rating: 9.2,
    duration: 166,
    ageRating: "T16",
    status: "now_showing"
  },
  {
    _id: "2",
    title: "Interstellar",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    genres: ["Khoa học viễn tưởng", "Drama"],
    rating: 9.0,
    duration: 169,
    ageRating: "T13",
    status: "now_showing"
  },
  {
    _id: "3",
    title: "Avengers: Endgame",
    poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    genres: ["Hành động", "Phiêu lưu"],
    rating: 8.9,
    duration: 181,
    ageRating: "T13",
    status: "now_showing"
  },
  {
    _id: "4",
    title: "The Batman",
    poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    genres: ["Hành động", "Trinh thám"],
    rating: 8.7,
    duration: 176,
    ageRating: "T16",
    status: "now_showing"
  }
];

const genres = [
  "Tất cả", "Hành động", "Hài", "Drama",
  "Trinh thám", "Tình cảm", "Viễn tưởng", "Kinh dị"
];

function App() {
  const location = useLocation();

  // Trang quản trị Admin
  if (location.pathname.startsWith("/admin")) {
    return <AdminPage />;
  }

  // Trang đăng nhập, đăng ký và quên mật khẩu
  if (["/login", "/register", "/forgot-password"].includes(location.pathname)) {
    return <AuthPage />;
  }

  // Trang tài khoản thành viên
  if (location.pathname === "/account") {
    return <ProfilePage />;
  }

  // Trang vé của tôi
  if (location.pathname === "/my-tickets") {
    return <MyTickets />;
  }

  // Trang đặt vé
  if (location.pathname.startsWith("/booking/")) {
    return <BookingPage />;
  }

  // Trang chi tiết phim
  if (location.pathname.startsWith("/movie/")) {
    return <MovieDetailPage />;
  }

  // Trang chủ
  return <HomePage />;
}

function HomePage() {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [comingSoonLoading, setComingSoonLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");
  const [activeTab, setActiveTab] = useState("Trang chủ");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isGlobeOpen, setIsGlobeOpen] = useState(false);
  const [city, setCity] = useState("Biên Hòa, Đồng Nai");
  const [cinemas, setCinemas] = useState([]);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cineglobeUser")) || null;
    } catch {
      return null;
    }
  });

  // Tai danh sach rap dang hoat dong tu MongoDB
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const response = await fetch(`${API}/cinemas`);

        if (!response.ok) {
          throw new Error("Khong tai duoc danh sach rap");
        }

        const result = await response.json();
        const list = result.cinemas || result.data || [];

        setCinemas(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Loi tai danh sach rap:", error);
        setCinemas([]);
      }
    };

    fetchCinemas();
  }, []);

  // Tao danh sach khu vuc duy nhat tu district va city
  const locationOptions = Array.from(
    new Set(
      cinemas.map((cinema) => {
        const district = (cinema.district || "").trim();
        const province = (cinema.city || "").trim();

        if (district && province) {
          return `${district}, ${province}`;
        }

        return district || province;
      }).filter(Boolean)
    )
  );

  // Tải danh sách phim đang chiếu
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(`${API}/movies`);

        if (!response.ok) {
          throw new Error("Không tải được phim");
        }

        const result = await response.json();

        const list = Array.isArray(result)
          ? result
          : result.movies || result.data || result.results || [];

        const nowShowingMovies = list.filter(
          (movie) => movie.status === "now_showing"
        );

        setMovies(
          nowShowingMovies.length ? nowShowingMovies : fallbackMovies
        );
      } catch (error) {
        console.error("Lỗi tải phim:", error);
        setMovies(fallbackMovies);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Tải danh sách phim sắp chiếu từ MongoDB
  useEffect(() => {
    const fetchComingSoonMovies = async () => {
      try {
        const response = await fetch(`${API}/movies/coming-soon`);

        if (!response.ok) {
          throw new Error("Không tải được danh sách phim sắp chiếu");
        }

        const result = await response.json();

        const list = Array.isArray(result)
          ? result
          : result.movies || result.data || result.results || [];

        setComingSoonMovies(list);
      } catch (error) {
        console.error("Lỗi tải phim sắp chiếu:", error);
        setComingSoonMovies([]);
      } finally {
        setComingSoonLoading(false);
      }
    };

    fetchComingSoonMovies();
  }, []);

  // Lọc phim
  const filteredMovies = movies.filter((movie) => {
    const title = (movie.title || movie.name || "").toLowerCase();

    const matchesSearch = title.includes(search.toLowerCase());

    const movieGenres = movie.genres || [];

    const matchesGenre =
      selectedGenre === "Tất cả" ||
      movieGenres.some((genre) =>
        String(genre).toLowerCase().includes(selectedGenre.toLowerCase())
      );

    return matchesSearch && matchesGenre;
  });

  const featuredMovie = movies[0] || fallbackMovies[0];

  const getPoster = (movie) =>
    movie.poster ||
    movie.posterUrl ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600";

  const getRating = (movie) => movie.rating || 8.8;

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("cineglobeToken");
    localStorage.removeItem("cineglobeUser");

    setCurrentUser(null);
    navigate("/");
  };

  // Mở trang tài khoản
  const openAccount = () => {
    if (!localStorage.getItem("cineglobeToken")) {
      navigate("/login");
      return;
    }

    navigate("/account");
  };

  // Đặt vé - chỉ cho phép phim đang khởi chiếu
  const handleBooking = (movie) => {
    if (!movie || !movie._id) {
      alert("Không tìm thấy thông tin phim. Vui lòng thử lại!");
      return;
    }

    if (movie.status !== "now_showing") {
      if (movie.status === "coming_soon") {
        alert("Phim chưa khởi chiếu. Bạn chưa thể đặt vé lúc này!");
      } else if (movie.status === "ended") {
        alert("Phim đã kết thúc. Bạn không thể đặt vé!");
      } else {
        alert("Phim hiện chưa mở bán vé. Vui lòng quay lại sau!");
      }

      return;
    }

    const token = localStorage.getItem("cineglobeToken");

    if (!token) {
      alert("Vui lòng đăng nhập trước khi đặt vé!");
      navigate("/login");
      return;
    }

    navigate(`/booking/${movie._id}`);
  };

  // Xem vé của tôi
  const openMyTickets = () => {
    if (!localStorage.getItem("cineglobeToken")) {
      alert("Vui lòng đăng nhập để xem vé của bạn!");
      navigate("/login");
      return;
    }

    navigate("/my-tickets");
  };

  // Mở Globe AI
  const openGlobeAI = () => {
    setActiveTab("AI Chat");
    setIsGlobeOpen(true);
  };

  const navItems = [
    { name: "Trang chủ", icon: Home },
    { name: "Tìm kiếm", icon: Search },
    { name: "AI Chat", icon: MessageCircle },
    { name: "Vé của tôi", icon: Ticket },
    { name: "Cá nhân", icon: UserRound }
  ];

  return (
    <div className="cine-app">

      {/* CINEMA MARQUEE */}
      <div className="cinema-marquee">
        <div className="marquee-track">

          <div className="marquee-group">
            <span>
              <Sparkles size={15} />
              CINEGLOBE - ỨNG DỤNG ĐẶT VÉ XEM PHIM
            </span>

            <span className="marquee-separator">✦</span>

            <span>
              <Ticket size={15} />
              XIN CHÀO QUÝ KHÁCH ĐẾN VỚI CINEGLOBE
            </span>

            <span className="marquee-separator">✦</span>

            <span>
              <Film size={15} />
              KHÁM PHÁ NHỮNG BỘ PHIM ĐẶC SẮC MỚI NHẤT
            </span>

            <span className="marquee-separator">✦</span>

            <span>
              <Star size={15} />
              ĐẶT VÉ NHANH CHÓNG - CHỌN GHẾ YÊU THÍCH
            </span>

            <span className="marquee-separator">✦</span>

            <span>
              <Sparkles size={15} />
              CHÚC QUÝ KHÁCH CÓ NHỮNG PHÚT GIÂY XEM PHIM TUYỆT VỜI
            </span>
          </div>

          <div className="marquee-group" aria-hidden="true">
            <span>
              <Sparkles size={15} />
              CINEGLOBE - ỨNG DỤNG ĐẶT VÉ XEM PHIM
            </span>

            <span className="marquee-separator">✦</span>

            <span>
              <Ticket size={15} />
              XIN CHÀO QUÝ KHÁCH ĐẾN VỚI CINEGLOBE
            </span>

            <span className="marquee-separator">✦</span>

            <span>
              <Film size={15} />
              KHÁM PHÁ NHỮNG BỘ PHIM ĐẶC SẮC MỚI NHẤT
            </span>

            <span className="marquee-separator">✦</span>

            <span>
              <Star size={15} />
              ĐẶT VÉ NHANH CHÓNG - CHỌN GHẾ YÊU THÍCH
            </span>

            <span className="marquee-separator">✦</span>

            <span>
              <Sparkles size={15} />
              CHÚC QUÝ KHÁCH CÓ NHỮNG PHÚT GIÂY XEM PHIM TUYỆT VỜI
            </span>
          </div>

        </div>
      </div>

      {/* HEADER */}
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-icon">C</span>
          <span>Cine<span>Globe</span></span>
        </Link>

        <nav className="desktop-nav">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.name}
              className={activeTab === item.name ? "nav-link active" : "nav-link"}
              onClick={() => {
                setActiveTab(item.name);

                if (item.name === "Tìm kiếm") {
                  setShowSearch(true);

                  document.getElementById("home")?.scrollIntoView({
                    behavior: "smooth"
                  });
                }

                if (item.name === "Vé của tôi") {
                  openMyTickets();
                }

                if (item.name === "AI Chat") {
                  openGlobeAI();
                }
              }}
            >
              {item.name}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">

          {/* NÚT ADMIN - CHỈ HIỆN VỚI TÀI KHOẢN ADMIN */}
          {currentUser?.role === "admin" && (
            <button
              className="profile-button admin-entry-button"
              onClick={() => navigate("/admin")}
              title="Trang quản trị CineGlobe"
            >
              <ShieldCheck size={17} />
              <span>Quản trị</span>
            </button>
          )}

          <button
            className="icon-button"
            onClick={() => setShowSearch(!showSearch)}
            title="Tìm kiếm phim"
          >
            <Search size={19} />
          </button>

          <button className="icon-button notification-button">
            <Bell size={19} />
            <span></span>
          </button>

          {currentUser ? (
            <div className="profile-actions">
              <button
                className="profile-button"
                onClick={openAccount}
              >
                <UserRound size={17} />
                <span>{currentUser.fullName || "Tài khoản"}</span>
              </button>

              <button
                className="icon-button"
                title="Đăng xuất"
                onClick={handleLogout}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              className="profile-button"
              onClick={() => navigate("/login")}
            >
              <LogIn size={17} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main id="home" className="main-content">

        <section className="welcome-row">
          <div>
            <p className="eyebrow">CINEGLOBE EXPERIENCE</p>

            <h1>
              {currentUser
                ? `Xin chào, ${currentUser.fullName}!`
                : "Chào mừng đến CineGlobe"}
              <span> 👋</span>
            </h1>

            <p className="welcome-subtitle">
              Khám phá thế giới điện ảnh theo cách của bạn.
            </p>
          </div>

          <div className="location-picker">
            <button
              className="location-pill"
              onClick={() => setIsLocationOpen((prev) => !prev)}
              aria-expanded={isLocationOpen}
              aria-label="Chọn khu vực xem phim"
            >
              <MapPin size={16} />
              {city}
              <ChevronRight
                size={15}
                className={isLocationOpen ? "location-chevron-open" : ""}
              />
            </button>

            {isLocationOpen && (
              <div className="location-menu">
                <p className="location-menu-title">CHỌN KHU VỰC</p>

                {locationOptions.length > 0 ? (
                  locationOptions.map((location) => (
                    <button
                      key={location}
                      className={`location-option ${
                        city === location ? "active" : ""
                      }`}
                      onClick={() => {
                        setCity(location);
                        setIsLocationOpen(false);
                      }}
                    >
                      <MapPin size={15} />
                      <span>{location}</span>
                      {city === location && <span className="location-check">✓</span>}
                    </button>
                  ))
                ) : (
                  <p className="location-empty">
                    Chưa có dữ liệu khu vực
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SEARCH */}
        {showSearch && (
          <div className="search-box">
            <Search size={19} />

            <input
              autoFocus
              placeholder="Tìm kiếm phim bạn yêu thích..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              onClick={() => {
                setSearch("");
                setShowSearch(false);
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* HERO */}
        <section className="hero-section">
          <div
            className="hero-backdrop"
            style={{
              backgroundImage: `linear-gradient(90deg, #080d1b 4%, rgba(8,13,27,.92) 35%, rgba(8,13,27,.15) 100%), url(${featuredMovie.backdrop || getPoster(featuredMovie)})`
            }}
          ></div>

          <div className="hero-content">
            <div className="match-label">
              <Sparkles size={14} /> MUST WATCH
            </div>

            <p className="hero-kicker">PHIM NỔI BẬT TUẦN NÀY</p>

            <h2>{featuredMovie.title || "Dune: Part Two"}</h2>

            <div className="hero-meta">
              <span className="rating">
                <Star size={15} fill="currentColor" />
                {getRating(featuredMovie)}
              </span>

              <span>{featuredMovie.duration || 166} phút</span>

              <span className="age-label">
                {featuredMovie.ageRating || "T16"}
              </span>
            </div>

            <p className="hero-description">
              Trải nghiệm hành trình điện ảnh đầy cảm xúc với hình ảnh mãn nhãn,
              âm thanh sống động và câu chuyện khó quên.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() => handleBooking(featuredMovie)}
              >
                <Ticket size={17} /> Đặt vé ngay
              </button>

              <button
                className="outline-button"
                onClick={() => navigate(`/movie/${featuredMovie._id}`)}
              >
                <Play size={17} /> Chi tiết phim
              </button>
            </div>
          </div>

          <div className="hero-indicator">
            <span className="indicator-active"></span>
            <span></span>
            <span></span>
          </div>
        </section>

        {/* AI BANNER */}
        <section className="ai-banner">
          <div className="ai-avatar">
            <Sparkles size={25} />
          </div>

          <div className="ai-copy">
            <div className="ai-title">
              AI CineGlobe <span>BETA</span>
            </div>

            <p>Để AI gợi ý bộ phim phù hợp với tâm trạng của bạn.</p>
          </div>

          <button onClick={openGlobeAI}>
            Trò chuyện <ChevronRight size={16} />
          </button>
        </section>

        {/* MOVIES */}
        <section className="movie-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MOVIE COLLECTION</p>
              <h2>Phim đang chiếu</h2>
            </div>

            <button
              className="see-all"
              onClick={() => {
                setShowSearch(true);

                document.getElementById("home")?.scrollIntoView({
                  behavior: "smooth"
                });
              }}
            >
              Xem tất cả <ChevronRight size={17} />
            </button>
          </div>

          <div className="genre-list">
            {genres.map((genre) => (
              <button
                key={genre}
                className={
                  selectedGenre === genre
                    ? "genre-chip selected"
                    : "genre-chip"
                }
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-state">
              Đang tải danh sách phim...
            </div>
          ) : (
            <div className="movie-grid">
              {filteredMovies.map((movie) => (
                <article className="movie-card" key={movie._id}>
                  <button
                    className="poster-button"
                    onClick={() => navigate(`/movie/${movie._id}`)}
                  >
                    <img src={getPoster(movie)} alt={movie.title} />

                    <span className="poster-age">
                      {movie.ageRating || "T16"}
                    </span>

                    <span className="poster-play">
                      <Play size={20} fill="white" />
                    </span>
                  </button>

                  <div className="movie-info">
                    <h3>{movie.title}</h3>

                    <div className="movie-rating">
                      <Star size={14} fill="currentColor" />
                      {getRating(movie)}
                      <span> • {movie.duration || 120} phút</span>
                    </div>

                    <p>
                      {(movie.genres || ["Điện ảnh"])
                        .slice(0, 2)
                        .join(" • ")}
                    </p>

                    <button
                      className="book-small"
                      onClick={() => handleBooking(movie)}
                    >
                      Đặt vé
                    </button>
                  </div>
                </article>
              ))}

              {filteredMovies.length === 0 && (
                <p className="empty-state">
                  Không tìm thấy phim phù hợp.
                </p>
              )}
            </div>
          )}
        </section>

        {/* COMING SOON */}
        <section className="coming-section">
          <div className="section-heading coming-heading">
            <div>
              <p className="eyebrow">COMING SOON</p>
              <h2>Phim sắp khởi chiếu</h2>
              <p className="coming-subtitle">
                Khám phá những thế giới điện ảnh đặc sắc tiếp theo tại CineGlobe.
              </p>
            </div>

            <div className="coming-heading-icon">
              <CalendarDays size={23} />
            </div>
          </div>

          {comingSoonLoading ? (
            <div className="coming-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div className="coming-movie-card coming-skeleton" key={index}>
                  <div className="coming-poster-wrap" />
                  <div className="coming-skeleton-info">
                    <span />
                    <span />
                  </div>
                </div>
              ))}
            </div>
          ) : comingSoonMovies.length > 0 ? (
            <div className="coming-grid">
              {comingSoonMovies.map((movie) => (
                <article className="coming-movie-card" key={movie._id}>
                  <button
                    type="button"
                    className="coming-poster-wrap"
                    onClick={() => navigate(`/movie/${movie._id}`)}
                    aria-label={`Xem chi tiết ${movie.title}`}
                  >
                    <div className="coming-poster-fallback">
                      <Film size={42} />
                      <span>CineGlobe</span>
                    </div>

                    {(movie.poster || movie.posterUrl) && (
                      <img
                        className="coming-poster"
                        src={movie.poster || movie.posterUrl}
                        alt={movie.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    <span className="coming-status">
                      <span className="coming-status-dot" />
                      Sắp chiếu
                    </span>

                    <span className="coming-poster-overlay">
                      <span className="coming-view-detail">
                        <Play size={15} fill="currentColor" />
                        Xem chi tiết
                      </span>
                    </span>
                  </button>

                  <div className="coming-movie-info">
                    <button
                      type="button"
                      className="coming-movie-title"
                      onClick={() => navigate(`/movie/${movie._id}`)}
                    >
                      {movie.title}
                    </button>

                    <div className="coming-movie-meta">
                      <span>
                        {movie.duration
                          ? `${movie.duration} phút`
                          : "Đang cập nhật"}
                      </span>

                      {movie.ageRating && (
                        <span className="coming-age-rating">
                          {movie.ageRating}
                        </span>
                      )}
                    </div>

                    <div className="coming-genres">
                      {(movie.genres || []).slice(0, 3).map((genre, index) => (
                        <span key={`${movie._id}-${index}`}>{genre}</span>
                      ))}
                    </div>

                    <div className="coming-release">
                      <CalendarDays size={14} />
                      <span>
                        {movie.releaseDate
                          ? new Date(movie.releaseDate).toLocaleDateString("vi-VN")
                          : "Ngày khởi chiếu đang cập nhật"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="coming-empty">
              <div className="coming-empty-icon">
                <Film size={34} />
              </div>
              <h3>Phim mới đang được cập nhật</h3>
              <p>
                Hãy quay lại CineGlobe để khám phá những bộ phim sắp tới nhé!
              </p>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="brand">
          <span className="brand-icon">C</span>
          <span>Cine<span>Globe</span></span>
        </div>

        <p>Thế giới điện ảnh trong tầm tay bạn.</p>

        <span>© 2026 CineGlobe</span>
      </footer>

      {/* MOBILE NAV */}
      <nav className="mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={
                activeTab === item.name
                  ? "mobile-nav-item active"
                  : "mobile-nav-item"
              }
              onClick={() => {
                setActiveTab(item.name);

                if (item.name === "Tìm kiếm") {
                  setShowSearch(true);
                }

                if (item.name === "Vé của tôi") {
                  openMyTickets();
                }

                if (item.name === "Cá nhân") {
                  openAccount();
                }

                if (item.name === "AI Chat") {
                  openGlobeAI();
                }
              }}
            >
              <Icon size={21} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* MOVIE DETAIL MODAL */}
      {selectedMovie && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedMovie(null)}
        >
          <div
            className="movie-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedMovie(null)}
            >
              <X size={20} />
            </button>

            <img
              src={getPoster(selectedMovie)}
              alt={selectedMovie.title}
            />

            <div className="modal-info">
              <p className="eyebrow">CINEGLOBE MOVIE</p>

              <h2>{selectedMovie.title}</h2>

              <p>
                <Star size={15} fill="currentColor" />
                {" "}{getRating(selectedMovie)}
                {" • "}{selectedMovie.duration || 120} phút
              </p>

              <p>
                {selectedMovie.description ||
                  "Khám phá bộ phim hấp dẫn này tại hệ thống rạp CineGlobe."}
              </p>

              <button
                className="primary-button"
                onClick={() => handleBooking(selectedMovie)}
              >
                <Ticket size={17} /> Chọn suất chiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBE AI CHAT */}
      <GlobeAI
        open={isGlobeOpen}
        onOpen={() => setIsGlobeOpen(true)}
        onClose={() => setIsGlobeOpen(false)}
      />

    </div>
  );
}

export default App;
