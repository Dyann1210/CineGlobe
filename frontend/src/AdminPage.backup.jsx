
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Film,
  Users,
  Ticket,
  Building2,
  DoorOpen,
  CalendarClock,
  CreditCard,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Clapperboard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Menu,
  Star,
  UserRound,
  ChevronRight
} from "lucide-react";

import "./AdminPage.css";
import AdminCinemaRooms from "./AdminCinemaRooms";

const API = "http://localhost:5000/api";

const emptyMovie = {
  title: "",
  description: "",
  poster: "",
  backdrop: "",
  trailer: "",
  genres: "",
  duration: 120,
  releaseDate: "",
  language: "Tiếng Việt",
  ageRating: "P",
  director: "",
  cast: "",
  status: "coming_soon",
  rating: 0,
  isFeatured: false
};

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Chưa cập nhật"
    : date.toLocaleDateString("vi-VN");
};

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("cineglobeToken");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
      result.error ||
      `Yêu cầu thất bại (${response.status})`
    );
  }

  return result;
}

function AdminPage() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("dashboard");
  const [admin, setAdmin] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dashboard, setDashboard] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  const [movies, setMovies] = useState([]);
  const [movieSearch, setMovieSearch] = useState("");
  const [movieStatus, setMovieStatus] = useState("");

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("");

  const [movieModal, setMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [savingMovie, setSavingMovie] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const logout = () => {
    localStorage.removeItem("cineglobeToken");
    localStorage.removeItem("cineglobeUser");
    navigate("/login");
  };

  // Xác thực tài khoản Admin
  useEffect(() => {
    let cancelled = false;

    const verifyAdmin = async () => {
      const token = localStorage.getItem("cineglobeToken");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const result = await apiRequest("/auth/me");
        const user = result.user || result.data?.user || result.data;

        if (!user || user.role !== "admin") {
          throw new Error("Tài khoản này không có quyền quản trị.");
        }

        if (!cancelled) {
          setAdmin(user);
          localStorage.setItem("cineglobeUser", JSON.stringify(user));
          setCheckingAuth(false);
        }
      } catch (error) {
        if (!cancelled) {
          localStorage.removeItem("cineglobeToken");
          localStorage.removeItem("cineglobeUser");

          showToast(
            error.message || "Không thể xác thực Admin.",
            "error"
          );

          navigate("/login");
        }
      }
    };

    verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Tải dữ liệu Dashboard
  const loadDashboard = useCallback(async () => {
    const result = await apiRequest("/admin/dashboard");

    setDashboard(
      result.statistics ||
      result.data?.statistics ||
      {}
    );

    setRecentBookings(
      result.recentBookings ||
      result.data?.recentBookings ||
      []
    );

    setRecentUsers(
      result.recentUsers ||
      result.data?.recentUsers ||
      []
    );
  }, []);

  // Tải danh sách phim
  const loadMovies = useCallback(async () => {
    const params = new URLSearchParams();

    if (movieSearch.trim()) {
      params.set("search", movieSearch.trim());
    }

    if (movieStatus) {
      params.set("status", movieStatus);
    }

    const query = params.toString();

    const result = await apiRequest(
      `/admin/movies${query ? `?${query}` : ""}`
    );

    setMovies(
      result.movies ||
      result.data?.movies ||
      []
    );
  }, [movieSearch, movieStatus]);

  // Tải danh sách người dùng
  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();

    if (userSearch.trim()) {
      params.set("search", userSearch.trim());
    }

    if (userRole) {
      params.set("role", userRole);
    }

    const query = params.toString();

    const result = await apiRequest(
      `/admin/users${query ? `?${query}` : ""}`
    );

    setUsers(
      result.users ||
      result.data?.users ||
      []
    );
  }, [userSearch, userRole]);

  // Làm mới dữ liệu theo trang hiện tại
  const refreshCurrentPage = useCallback(async () => {
    setLoading(true);

    try {
      if (activePage === "dashboard") {
        await loadDashboard();
      } else if (activePage === "movies") {
        await loadMovies();
      } else if (activePage === "users") {
        await loadUsers();
      }
    } catch (error) {
      showToast(
        error.message || "Không tải được dữ liệu.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [
    activePage,
    loadDashboard,
    loadMovies,
    loadUsers
  ]);

  useEffect(() => {
    if (!admin) return;

    refreshCurrentPage();
  }, [admin, refreshCurrentPage]);

  // Mở form thêm phim
  const openAddMovie = () => {
    setEditingMovie(null);
    setMovieForm({ ...emptyMovie });
    setMovieModal(true);
  };

  // Mở form chỉnh sửa phim
  const openEditMovie = (movie) => {
    setEditingMovie(movie);

    setMovieForm({
      title: movie.title || "",
      description: movie.description || "",
      poster: movie.poster || "",
      backdrop: movie.backdrop || "",
      trailer: movie.trailer || "",
      genres: (movie.genres || []).join(", "),
      duration: movie.duration || 120,
      releaseDate: movie.releaseDate
        ? new Date(movie.releaseDate).toISOString().slice(0, 10)
        : "",
      language: movie.language || "Tiếng Việt",
      ageRating: movie.ageRating || "P",
      director: movie.director || "",
      cast: (movie.cast || []).join(", "),
      status: movie.status || "coming_soon",
      rating: movie.rating || 0,
      isFeatured: Boolean(movie.isFeatured)
    });

    setMovieModal(true);
  };

  // Thay đổi dữ liệu form phim
  const handleMovieFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setMovieForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Thêm hoặc cập nhật phim
  const saveMovie = async (event) => {
    event.preventDefault();

    if (!movieForm.title.trim()) {
      showToast("Vui lòng nhập tên phim.", "error");
      return;
    }

    if (Number(movieForm.duration) <= 0) {
      showToast(
        "Thời lượng phim phải lớn hơn 0.",
        "error"
      );
      return;
    }

    const payload = {
      ...movieForm,
      duration: Number(movieForm.duration),
      rating: Number(movieForm.rating),

      genres: movieForm.genres
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      cast: movieForm.cast
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };

    if (!payload.releaseDate) {
      delete payload.releaseDate;
    }

    setSavingMovie(true);

    try {
      if (editingMovie) {
        await apiRequest(
          `/admin/movies/${editingMovie._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload)
          }
        );

        showToast("Cập nhật phim thành công!");
      } else {
        await apiRequest("/admin/movies", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        showToast("Thêm phim mới thành công!");
      }

      setMovieModal(false);
      await loadMovies();
    } catch (error) {
      showToast(
        error.message || "Không lưu được phim.",
        "error"
      );
    } finally {
      setSavingMovie(false);
    }
  };

  // Xóa phim
  const deleteMovie = async (movie) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phim "${movie.title}" không?`
    );

    if (!confirmed) return;

    try {
      await apiRequest(
        `/admin/movies/${movie._id}`,
        { method: "DELETE" }
      );

      showToast("Đã xóa phim thành công.");
      await loadMovies();
    } catch (error) {
      showToast(
        error.message || "Không xóa được phim.",
        "error"
      );
    }
  };

  // Thay đổi quyền người dùng
  const changeUserRole = async (user, role) => {
    if (user._id === admin?._id) {
      showToast(
        "Bạn không thể tự thay đổi quyền của mình.",
        "error"
      );
      return;
    }

    try {
      await apiRequest(`/admin/users/${user._id}`, {
        method: "PUT",
        body: JSON.stringify({ role })
      });

      showToast("Đã cập nhật quyền người dùng.");
      await loadUsers();
    } catch (error) {
      showToast(
        error.message || "Không cập nhật được quyền.",
        "error"
      );
    }
  };

  // Xóa người dùng
  const deleteUser = async (user) => {
    if (user._id === admin?._id) {
      showToast(
        "Bạn không thể tự xóa tài khoản của mình.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${user.fullName}" không?`
    );

    if (!confirmed) return;

    try {
      await apiRequest(
        `/admin/users/${user._id}`,
        { method: "DELETE" }
      );

      showToast("Đã xóa người dùng.");
      await loadUsers();
    } catch (error) {
      showToast(
        error.message || "Không xóa được người dùng.",
        "error"
      );
    }
  };

  // Thống kê
  const stats = [
    {
      label: "Tổng người dùng",
      value: dashboard.totalUsers ?? 0,
      icon: Users,
      color: "purple",
      note: "Tài khoản trên hệ thống"
    },
    {
      label: "Tổng số phim",
      value: dashboard.totalMovies ?? 0,
      icon: Film,
      color: "blue",
      note: "Phim trong cơ sở dữ liệu"
    },
    {
      label: "Phim đang chiếu",
      value: dashboard.nowShowing ?? 0,
      icon: Clapperboard,
      color: "pink",
      note: "Đang mở bán vé"
    },
    {
      label: "Tổng đơn đặt vé",
      value: dashboard.totalBookings ?? 0,
      icon: Ticket,
      color: "orange",
      note: `${dashboard.pendingBookings ?? 0} đơn đang chờ`
    }
  ];

  // Menu chính
  const navigation = [
    {
      id: "dashboard",
      label: "Tổng quan",
      icon: LayoutDashboard
    },
    {
      id: "movies",
      label: "Quản lý phim",
      icon: Film
    },
    {
      id: "users",
      label: "Người dùng",
      icon: Users
    }
  ];

  // Kiểm tra quyền Admin
  if (checkingAuth) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loader" />
        <h3>Đang xác thực quyền quản trị...</h3>
        <p>Vui lòng đợi trong giây lát.</p>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <button
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Đóng menu"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="admin-brand">
          <div className="admin-brand-icon">C</div>

          <div>
            <strong>
              Cine<span>Globe</span>
            </strong>
            <small>ADMINISTRATION</small>
          </div>
        </div>

        <div className="admin-profile-card">
          <div className="admin-avatar">
            <ShieldCheck size={23} />
          </div>

          <div className="admin-profile-info">
            <strong>
              {admin.fullName || "Administrator"}
            </strong>
            <span>Quản trị viên</span>
          </div>

          <span className="admin-online-dot" />
        </div>

        <div className="admin-menu-title">
          MENU CHÍNH
        </div>

        <nav className="admin-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={
                  activePage === item.id
                    ? "admin-nav-item active"
                    : "admin-nav-item"
                }
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {activePage === item.id && (
                  <ChevronRight size={17} />
                )}
              </button>
            );
          })}
        </nav>

        {/* MENU HỆ THỐNG */}
        <div className="admin-menu-title admin-other-title">
          HỆ THỐNG
        </div>

        <div className="admin-navigation">
          <button
            className={
              activePage === "cinemas"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() => {
              setActivePage("cinemas");
              setSidebarOpen(false);
            }}
          >
            <Building2 size={19} />
            <span>Rạp chiếu phim</span>

            {activePage === "cinemas" && (
              <ChevronRight size={17} />
            )}
          </button>

          <button
            className={
              activePage === "rooms"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() => {
              setActivePage("rooms");
              setSidebarOpen(false);
            }}
          >
            <DoorOpen size={19} />
            <span>Phòng chiếu</span>

            {activePage === "rooms" && (
              <ChevronRight size={17} />
            )}
          </button>

          <div className="admin-nav-disabled">
            <CalendarClock size={19} />
            <span>Suất chiếu</span>
            <small>Sắp tới</small>
          </div>

          <div className="admin-nav-disabled">
            <CreditCard size={19} />
            <span>Thanh toán</span>
            <small>Sắp tới</small>
          </div>
        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="admin-sidebar-bottom">
          <div className="admin-help-card">
            <div className="admin-help-icon">
              <ShieldCheck size={19} />
            </div>

            <strong>Admin Center</strong>

            <p>
              Quản lý hệ thống CineGlobe của bạn.
            </p>
          </div>

          <button
            className="admin-logout"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>

          <button
            className="admin-back-home"
            onClick={() => navigate("/")}
          >
            <ChevronRight size={17} />
            Quay lại trang chủ
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="admin-breadcrumb">
                CineGlobe <ChevronRight size={14} /> Quản trị
              </div>

              <h1>
                {activePage === "dashboard"
                  ? "Tổng quan hệ thống"
                  : activePage === "movies"
                    ? "Quản lý phim"
                    : activePage === "cinemas"
                      ? "Quản lý rạp chiếu phim"
                      : activePage === "rooms"
                        ? "Quản lý phòng chiếu"
                        : "Quản lý người dùng"}
              </h1>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button
              className="admin-refresh-button"
              onClick={refreshCurrentPage}
              disabled={loading}
              title="Làm mới dữ liệu"
            >
              <RefreshCw
                size={17}
                className={loading ? "spinning" : ""}
              />
              <span>Làm mới</span>
            </button>

            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">
                <UserRound size={18} />
              </div>

              <div>
                <strong>
                  {admin.fullName || "Admin"}
                </strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="admin-content">
          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <>
              <section className="admin-welcome-banner">
                <div>
                  <span className="admin-welcome-tag">
                    <ShieldCheck size={14} />
                    ADMIN DASHBOARD
                  </span>

                  <h2>
                    Xin chào, {admin.fullName || "Admin"}! 👋
                  </h2>

                  <p>
                    Chào mừng trở lại. Đây là tình hình hoạt động
                    của CineGlobe.
                  </p>
                </div>

                <div className="admin-welcome-art">
                  <Clapperboard
                    size={86}
                    strokeWidth={1.2}
                  />
                  <SparklesIcon />
                </div>
              </section>

              <section className="admin-stats-grid">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article
                      className="admin-stat-card"
                      key={stat.label}
                    >
                      <div
                        className={`admin-stat-icon ${stat.color}`}
                      >
                        <Icon size={22} />
                      </div>

                      <div className="admin-stat-label">
                        {stat.label}
                      </div>

                      <div className="admin-stat-value">
                        {Number(stat.value).toLocaleString("vi-VN")}
                      </div>

                      <div className="admin-stat-note">
                        <TrendingUp size={14} />
                        {stat.note}
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="admin-overview-grid">
                <article className="admin-panel admin-revenue-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span className="admin-panel-eyebrow">
                        DOANH THU
                      </span>
                      <h3>Tổng quan doanh thu</h3>
                    </div>

                    <div className="admin-panel-icon purple">
                      <CreditCard size={20} />
                    </div>
                  </div>

                  <div className="admin-revenue-value">
                    {formatMoney(dashboard.revenue)}
                  </div>

                  <p className="admin-muted">
                    Tổng tiền từ các giao dịch thanh toán thành công.
                  </p>

                  <div className="admin-revenue-decoration">
                    <div style={{ height: "35%" }} />
                    <div style={{ height: "55%" }} />
                    <div style={{ height: "43%" }} />
                    <div style={{ height: "72%" }} />
                    <div style={{ height: "60%" }} />
                    <div style={{ height: "88%" }} />
                    <div style={{ height: "76%" }} />
                    <div style={{ height: "100%" }} />
                  </div>
                </article>

                <article className="admin-panel admin-quick-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span className="admin-panel-eyebrow">
                        THỐNG KÊ
                      </span>
                      <h3>Hoạt động hệ thống</h3>
                    </div>

                    <div className="admin-panel-icon blue">
                      <TrendingUp size={20} />
                    </div>
                  </div>

                  <div className="admin-quick-row">
                    <span>
                      <Film size={17} /> Phim sắp chiếu
                    </span>
                    <strong>{dashboard.comingSoon ?? 0}</strong>
                  </div>

                  <div className="admin-quick-row">
                    <span>
                      <Ticket size={17} /> Vé đã phát hành
                    </span>
                    <strong>{dashboard.totalTickets ?? 0}</strong>
                  </div>

                  <div className="admin-quick-row">
                    <span>
                      <Building2 size={17} /> Rạp chiếu phim
                    </span>
                    <strong>{dashboard.totalCinemas ?? 0}</strong>
                  </div>

                  <div className="admin-quick-row">
                    <span>
                      <CalendarClock size={17} /> Suất chiếu
                    </span>
                    <strong>{dashboard.totalShowtimes ?? 0}</strong>
                  </div>
                </article>
              </section>

              {/* ĐƠN ĐẶT VÉ GẦN ĐÂY */}
              <section className="admin-panel admin-table-panel">
                <div className="admin-panel-heading">
                  <div>
                    <span className="admin-panel-eyebrow">
                      BOOKING MANAGEMENT
                    </span>
                    <h3>Đơn đặt vé gần đây</h3>
                  </div>

                  <span className="admin-live-label">
                    <span /> Dữ liệu hệ thống
                  </span>
                </div>

                {recentBookings.length === 0 ? (
                  <div className="admin-empty">
                    <Ticket size={34} />
                    <strong>Chưa có đơn đặt vé</strong>
                    <span>
                      Các đơn đặt vé mới sẽ hiển thị tại đây.
                    </span>
                  </div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã đặt vé</th>
                          <th>Khách hàng</th>
                          <th>Phim</th>
                          <th>Ngày đặt</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentBookings.map((booking) => (
                          <tr key={booking._id}>
                            <td className="admin-code">
                              {booking.bookingCode || "—"}
                            </td>

                            <td>
                              {booking.user?.fullName || "Khách hàng"}
                            </td>

                            <td>
                              {booking.movie?.title || "—"}
                            </td>

                            <td>
                              {formatDate(booking.createdAt)}
                            </td>

                            <td className="admin-money">
                              {formatMoney(
                                booking.finalAmount ??
                                booking.totalAmount
                              )}
                            </td>

                            <td>
                              <span
                                className={`admin-status ${booking.status}`}
                              >
                                {booking.status === "confirmed"
                                  ? "Đã xác nhận"
                                  : booking.status === "pending"
                                    ? "Đang chờ"
                                    : booking.status === "cancelled"
                                      ? "Đã hủy"
                                      : booking.status || "Khác"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* NGƯỜI DÙNG MỚI */}
              <section className="admin-panel admin-table-panel">
                <div className="admin-panel-heading">
                  <div>
                    <span className="admin-panel-eyebrow">
                      MEMBER MANAGEMENT
                    </span>
                    <h3>Người dùng mới</h3>
                  </div>

                  <button
                    className="admin-text-button"
                    onClick={() => setActivePage("users")}
                  >
                    Xem tất cả <ChevronRight size={16} />
                  </button>
                </div>

                {recentUsers.length === 0 ? (
                  <div className="admin-empty">
                    <Users size={34} />
                    <strong>Chưa có người dùng</strong>
                  </div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Họ và tên</th>
                          <th>Email</th>
                          <th>Số điện thoại</th>
                          <th>Ngày tham gia</th>
                          <th>Vai trò</th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentUsers.map((user) => (
                          <tr key={user._id}>
                            <td className="admin-user-name">
                              <span className="admin-small-avatar">
                                {(user.fullName || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                              {user.fullName}
                            </td>

                            <td>{user.email}</td>

                            <td>
                              {user.phone || "Chưa cập nhật"}
                            </td>

                            <td>{formatDate(user.createdAt)}</td>

                            <td>
                              <span className={`admin-role ${user.role}`}>
                                {user.role === "admin"
                                  ? "Admin"
                                  : "Khách hàng"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* QUẢN LÝ PHIM */}
          {activePage === "movies" && (
            <section className="admin-panel admin-management-panel">
              <div className="admin-management-heading">
                <div>
                  <span className="admin-panel-eyebrow">
                    MOVIE MANAGEMENT
                  </span>

                  <h2>Danh sách phim</h2>

                  <p>
                    Thêm, chỉnh sửa và quản lý phim trong CineGlobe.
                  </p>
                </div>

                <button
                  className="admin-primary-button"
                  onClick={openAddMovie}
                >
                  <Plus size={18} /> Thêm phim mới
                </button>
              </div>

              <div className="admin-filter-bar">
                <div className="admin-search">
                  <Search size={18} />

                  <input
                    value={movieSearch}
                    onChange={(event) =>
                      setMovieSearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") loadMovies();
                    }}
                    placeholder="Tìm theo tên phim..."
                  />
                </div>

                <select
                  value={movieStatus}
                  onChange={(event) =>
                    setMovieStatus(event.target.value)
                  }
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="now_showing">Đang chiếu</option>
                  <option value="coming_soon">Sắp chiếu</option>
                  <option value="ended">Đã kết thúc</option>
                </select>

                <button
                  className="admin-filter-button"
                  onClick={loadMovies}
                  disabled={loading}
                >
                  <Search size={17} /> Tìm kiếm
                </button>
              </div>

              {loading ? (
                <div className="admin-empty">
                  <div className="admin-loader" />
                  <span>Đang tải danh sách phim...</span>
                </div>
              ) : movies.length === 0 ? (
                <div className="admin-empty">
                  <Film size={38} />
                  <strong>Không tìm thấy phim</strong>
                  <span>
                    Hãy thử thay đổi từ khóa tìm kiếm.
                  </span>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table admin-movie-table">
                    <thead>
                      <tr>
                        <th>Phim</th>
                        <th>Thể loại</th>
                        <th>Thời lượng</th>
                        <th>Đánh giá</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {movies.map((movie) => (
                        <tr key={movie._id}>
                          <td>
                            <div className="admin-movie-cell">
                              <img
                                src={
                                  movie.poster ||
                                  "https://placehold.co/70x95?text=Movie"
                                }
                                alt={movie.title}
                                onError={(event) => {
                                  event.currentTarget.src =
                                    "https://placehold.co/70x95?text=Movie";
                                }}
                              />

                              <div>
                                <strong>{movie.title}</strong>
                                <span>
                                  {movie.ageRating || "P"} ·{" "}
                                  {formatDate(movie.releaseDate)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="admin-genre-tags">
                              {(movie.genres || [])
                                .slice(0, 2)
                                .map((genre) => (
                                  <span key={genre}>{genre}</span>
                                ))}
                            </div>
                          </td>

                          <td>{movie.duration} phút</td>

                          <td>
                            <span className="admin-rating">
                              <Star
                                size={14}
                                fill="currentColor"
                              />
                              {movie.rating || 0}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`admin-status ${movie.status}`}
                            >
                              {movie.status === "now_showing"
                                ? "Đang chiếu"
                                : movie.status === "coming_soon"
                                  ? "Sắp chiếu"
                                  : "Đã kết thúc"}
                            </span>
                          </td>

                          <td>
                            <div className="admin-action-buttons">
                              <button
                                className="admin-edit-button"
                                onClick={() => openEditMovie(movie)}
                                title="Chỉnh sửa"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                className="admin-delete-button"
                                onClick={() => deleteMovie(movie)}
                                title="Xóa phim"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="admin-list-footer">
                Hiển thị {movies.length} phim từ cơ sở dữ liệu CineGlobe.
              </div>
            </section>
          )}

          {/* QUẢN LÝ NGƯỜI DÙNG */}
          {activePage === "users" && (
            <section className="admin-panel admin-management-panel">
              <div className="admin-management-heading">
                <div>
                  <span className="admin-panel-eyebrow">
                    USER MANAGEMENT
                  </span>

                  <h2>Danh sách người dùng</h2>

                  <p>
                    Quản lý tài khoản và phân quyền người dùng.
                  </p>
                </div>

                <div className="admin-total-users">
                  <Users size={20} />
                  <strong>{users.length}</strong>
                  <span>tài khoản</span>
                </div>
              </div>

              <div className="admin-filter-bar">
                <div className="admin-search">
                  <Search size={18} />

                  <input
                    value={userSearch}
                    onChange={(event) =>
                      setUserSearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") loadUsers();
                    }}
                    placeholder="Tìm theo tên hoặc email..."
                  />
                </div>

                <select
                  value={userRole}
                  onChange={(event) =>
                    setUserRole(event.target.value)
                  }
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="customer">Khách hàng</option>
                  <option value="admin">Quản trị viên</option>
                </select>

                <button
                  className="admin-filter-button"
                  onClick={loadUsers}
                  disabled={loading}
                >
                  <Search size={17} /> Tìm kiếm
                </button>
              </div>

              {loading ? (
                <div className="admin-empty">
                  <div className="admin-loader" />
                  <span>Đang tải người dùng...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="admin-empty">
                  <Users size={38} />
                  <strong>Không tìm thấy người dùng</strong>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Ngày tham gia</th>
                        <th>Phân quyền</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="admin-user-name">
                              <span className="admin-small-avatar">
                                {(user.fullName || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>

                              <div>
                                <strong>{user.fullName}</strong>

                                {user._id === admin._id && (
                                  <small>Tài khoản của bạn</small>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>{user.email}</td>

                          <td>
                            {user.phone || "Chưa cập nhật"}
                          </td>

                          <td>{formatDate(user.createdAt)}</td>

                          <td>
                            <select
                              className="admin-role-select"
                              value={user.role || "customer"}
                              disabled={user._id === admin._id}
                              onChange={(event) =>
                                changeUserRole(
                                  user,
                                  event.target.value
                                )
                              }
                            >
                              <option value="customer">
                                Khách hàng
                              </option>
                              <option value="admin">
                                Admin
                              </option>
                            </select>
                          </td>

                          <td>
                            <button
                              className="admin-delete-button"
                              disabled={user._id === admin._id}
                              onClick={() => deleteUser(user)}
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="admin-list-footer">
                Hiển thị {users.length} người dùng từ cơ sở dữ liệu CineGlobe.
              </div>
            </section>
          )}

          {/* QUẢN LÝ RẠP VÀ PHÒNG CHIẾU */}
          {(activePage === "cinemas" ||
            activePage === "rooms") && (
            <AdminCinemaRooms
              mode={activePage}
              key={activePage}
            />
          )}
        </div>

        {/* FOOTER */}
        <footer className="admin-footer">
          <span>© 2026 CineGlobe Admin Center</span>

          <span>
            <ShieldCheck size={14} />
            Hệ thống quản trị
          </span>
        </footer>
      </main>

      {/* MODAL THÊM / SỬA PHIM */}
      {movieModal && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMovieModal(false);
            }
          }}
        >
          <form
            className="admin-movie-modal"
            onSubmit={saveMovie}
          >
            <div className="admin-modal-heading">
              <div>
                <span className="admin-panel-eyebrow">
                  MOVIE INFORMATION
                </span>

                <h2>
                  {editingMovie
                    ? "Chỉnh sửa phim"
                    : "Thêm phim mới"}
                </h2>

                <p>
                  Thông tin phim sẽ được lưu vào MongoDB.
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setMovieModal(false)}
              >
                <X size={21} />
              </button>
            </div>

            <div className="admin-form-grid">
              <label className="admin-form-field full">
                Tên phim *
                <input
                  name="title"
                  value={movieForm.title}
                  onChange={handleMovieFormChange}
                  placeholder="Nhập tên phim"
                  required
                />
              </label>

              <label className="admin-form-field full">
                Mô tả phim
                <textarea
                  name="description"
                  value={movieForm.description}
                  onChange={handleMovieFormChange}
                  placeholder="Nội dung giới thiệu phim..."
                  rows="3"
                />
              </label>

              <label className="admin-form-field full">
                Đường dẫn poster
                <input
                  name="poster"
                  value={movieForm.poster}
                  onChange={handleMovieFormChange}
                  placeholder="https://..."
                />
              </label>

              <label className="admin-form-field full">
                Đường dẫn ảnh nền
                <input
                  name="backdrop"
                  value={movieForm.backdrop}
                  onChange={handleMovieFormChange}
                  placeholder="https://..."
                />
              </label>

              <label className="admin-form-field full">
                Đường dẫn trailer
                <input
                  name="trailer"
                  value={movieForm.trailer}
                  onChange={handleMovieFormChange}
                  placeholder="https://..."
                />
              </label>

              <label className="admin-form-field">
                Thể loại
                <input
                  name="genres"
                  value={movieForm.genres}
                  onChange={handleMovieFormChange}
                  placeholder="Hành động, Viễn tưởng"
                />
                <small>Phân cách bằng dấu phẩy.</small>
              </label>

              <label className="admin-form-field">
                Thời lượng (phút) *
                <input
                  type="number"
                  min="1"
                  name="duration"
                  value={movieForm.duration}
                  onChange={handleMovieFormChange}
                  required
                />
              </label>

              <label className="admin-form-field">
                Ngày khởi chiếu
                <input
                  type="date"
                  name="releaseDate"
                  value={movieForm.releaseDate}
                  onChange={handleMovieFormChange}
                />
              </label>

              <label className="admin-form-field">
                Ngôn ngữ
                <input
                  name="language"
                  value={movieForm.language}
                  onChange={handleMovieFormChange}
                />
              </label>

              <label className="admin-form-field">
                Độ tuổi
                <select
                  name="ageRating"
                  value={movieForm.ageRating}
                  onChange={handleMovieFormChange}
                >
                  <option value="P">P - Mọi lứa tuổi</option>
                  <option value="K">K</option>
                  <option value="T13">T13</option>
                  <option value="T16">T16</option>
                  <option value="T18">T18</option>
                  <option value="C">C</option>
                </select>
              </label>

              <label className="admin-form-field">
                Đạo diễn
                <input
                  name="director"
                  value={movieForm.director}
                  onChange={handleMovieFormChange}
                  placeholder="Tên đạo diễn"
                />
              </label>

              <label className="admin-form-field">
                Đánh giá
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  name="rating"
                  value={movieForm.rating}
                  onChange={handleMovieFormChange}
                />
              </label>

              <label className="admin-form-field full">
                Diễn viên
                <input
                  name="cast"
                  value={movieForm.cast}
                  onChange={handleMovieFormChange}
                  placeholder="Diễn viên 1, Diễn viên 2"
                />
                <small>
                  Phân cách tên diễn viên bằng dấu phẩy.
                </small>
              </label>

              <label className="admin-form-field full">
                Trạng thái phim
                <select
                  name="status"
                  value={movieForm.status}
                  onChange={handleMovieFormChange}
                >
                  <option value="now_showing">Đang chiếu</option>
                  <option value="coming_soon">Sắp chiếu</option>
                  <option value="ended">Đã kết thúc</option>
                </select>
              </label>

              <label className="admin-feature-checkbox">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={movieForm.isFeatured}
                  onChange={handleMovieFormChange}
                />
                <span>Đánh dấu phim nổi bật</span>
              </label>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-cancel-button"
                onClick={() => setMovieModal(false)}
                disabled={savingMovie}
              >
                Hủy
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={savingMovie}
              >
                {savingMovie ? (
                  <RefreshCw
                    size={17}
                    className="spinning"
                  />
                ) : (
                  <Save size={17} />
                )}

                {savingMovie
                  ? "Đang lưu..."
                  : "Lưu thông tin"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* THÔNG BÁO */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}

          <span>{toast.message}</span>

          <button
            onClick={() => setToast(null)}
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <span className="admin-sparkle-decoration">
      <Star size={22} />
    </span>
  );
}

export default AdminPage;
