
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound, Mail, Phone, CalendarDays, Ticket,
  Wallet, Star, Award, ShieldCheck, Clock3,
  Edit3, Save, X, ArrowLeft, Film, MapPin,
  RefreshCw, LogOut
} from "lucide-react";
import "./ProfilePage.css";

const API = "http://localhost:5000/api";

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";

const formatDate = (value) => {
  if (!value) return "Chưa có thông tin";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thông tin";
  return date.toLocaleDateString("vi-VN");
};

function ProfilePage() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("cineglobeToken");

  const loadProfile = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/members/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("cineglobeToken");
        localStorage.removeItem("cineglobeUser");
        navigate("/login");
        return;
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Không thể tải thông tin tài khoản.");
      }

      const profileData = result.data || result;
      setData(profileData);

      const profile = profileData.profile || profileData.user || {};
      setForm({
        fullName: profile.fullName || "",
        phone: profile.phone || ""
      });
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setMessage("Vui lòng nhập họ và tên.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/members/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim()
        })
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Không thể cập nhật hồ sơ.");
      }

      const updatedUser = result.user || result.profile || result.data;

      if (updatedUser) {
        const oldUser = JSON.parse(
          localStorage.getItem("cineglobeUser") || "{}"
        );

        localStorage.setItem(
          "cineglobeUser",
          JSON.stringify({
            ...oldUser,
            ...updatedUser,
            fullName: updatedUser.fullName || form.fullName.trim(),
            phone: updatedUser.phone ?? form.phone.trim()
          })
        );
      }

      await loadProfile();
      setEditing(false);
      setMessage("Cập nhật thông tin thành công!");
    } catch (err) {
      setMessage(err.message || "Không thể lưu thông tin.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("cineglobeToken");
    localStorage.removeItem("cineglobeUser");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="member-loading">
        <div className="member-spinner"></div>
        <h3>Đang tải hồ sơ thành viên...</h3>
        <p>CineGlobe đang kết nối dữ liệu tài khoản của bạn.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="member-error">
        <div className="member-error-icon">
          <UserRound size={32} />
        </div>
        <h2>Không tải được hồ sơ</h2>
        <p>{error || "Không tìm thấy dữ liệu tài khoản."}</p>
        <div className="member-error-actions">
          <button onClick={loadProfile}>
            <RefreshCw size={17} /> Thử lại
          </button>
          <button className="secondary" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const profile = data.profile || data.user || {};
  const membership = data.membership || {};
  const stats = data.statistics || {};
  const level = membership.level;
  const levelName =
    typeof level === "string"
      ? level
      : level?.name || level?.title || level?.label || "Bronze";

  const points = Number(
    membership.points ?? stats.points ?? 0
  );

  const badges = Array.isArray(data.badges) ? data.badges : [];
  const bookings = Array.isArray(data.recentBookings)
    ? data.recentBookings
    : [];

  const unlockedBadges = Number(
    stats.unlockedBadges ??
    badges.filter((badge) => badge.unlocked).length
  );

  return (
    <div className="member-page">
      <header className="member-header">
        <button className="member-back" onClick={() => navigate("/")}>
          <ArrowLeft size={19} />
          <span>Trang chủ</span>
        </button>

        <div className="member-brand">
          <span className="member-brand-icon">C</span>
          Cine<span>Globe</span>
        </div>

        <button className="member-logout" onClick={logout}>
          <LogOut size={17} />
          Đăng xuất
        </button>
      </header>

      <main className="member-container">
        <section className="member-welcome">
          <div>
            <span className="member-eyebrow">CINEGLOBE MEMBERSHIP</span>
            <h1>Tài khoản của tôi</h1>
            <p>Quản lý thông tin và theo dõi hành trình điện ảnh của bạn.</p>
          </div>

          <div className="member-welcome-icon">
            <Award size={42} />
          </div>
        </section>

        <section className="member-hero-card">
          <div className="member-hero-glow"></div>

          <div className="member-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Ảnh đại diện" />
            ) : (
              <UserRound size={43} />
            )}
          </div>

          <div className="member-hero-info">
            <span className="member-small-label">THÀNH VIÊN CINEGLOBE</span>
            <h2>{profile.fullName || "Thành viên CineGlobe"}</h2>
            <p>{profile.email || "Chưa có email"}</p>
            <span className="member-code">
              Mã thành viên: {profile.memberCode || profile.id || "CG-MEMBER"}
            </span>
          </div>

          <div className="member-level">
            <Award size={25} />
            <span>HẠNG THÀNH VIÊN</span>
            <strong>{levelName}</strong>
            <small>{points.toLocaleString("vi-VN")} điểm tích lũy</small>
          </div>
        </section>

        <section className="member-stats-grid">
          <article className="member-stat-card">
            <div className="member-stat-icon purple">
              <Star size={21} />
            </div>
            <span>Điểm tích lũy</span>
            <strong>{points.toLocaleString("vi-VN")}</strong>
            <small>Điểm thưởng hiện tại</small>
          </article>

          <article className="member-stat-card">
            <div className="member-stat-icon pink">
              <Ticket size={21} />
            </div>
            <span>Vé đã đặt</span>
            <strong>{Number(stats.bookingCount || 0)}</strong>
            <small>Lượt đặt vé thành công</small>
          </article>

          <article className="member-stat-card">
            <div className="member-stat-icon blue">
              <Film size={21} />
            </div>
            <span>Ghế đã đặt</span>
            <strong>{Number(stats.ticketCount || 0)}</strong>
            <small>Tổng số ghế đã thanh toán</small>
          </article>

          <article className="member-stat-card">
            <div className="member-stat-icon orange">
              <Wallet size={21} />
            </div>
            <span>Tổng chi tiêu</span>
            <strong>{formatMoney(stats.totalSpent)}</strong>
            <small>Giao dịch thanh toán thành công</small>
          </article>
        </section>

        <div className="member-content-grid">
          <section className="member-panel member-information">
            <div className="member-panel-heading">
              <div>
                <span className="member-eyebrow">PERSONAL INFORMATION</span>
                <h2>Thông tin cá nhân</h2>
              </div>

              {!editing ? (
                <button
                  className="member-edit-button"
                  onClick={() => {
                    setMessage("");
                    setEditing(true);
                  }}
                >
                  <Edit3 size={16} /> Chỉnh sửa
                </button>
              ) : (
                <button
                  className="member-cancel-button"
                  onClick={() => {
                    setEditing(false);
                    setMessage("");
                    setForm({
                      fullName: profile.fullName || "",
                      phone: profile.phone || ""
                    });
                  }}
                >
                  <X size={16} /> Hủy
                </button>
              )}
            </div>

            {editing ? (
              <form className="member-edit-form" onSubmit={saveProfile}>
                <label>Họ và tên</label>
                <input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  placeholder="Nhập họ và tên"
                  required
                />

                <label>Email</label>
                <input value={profile.email || ""} disabled />

                <label>Số điện thoại</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="Nhập số điện thoại"
                />

                <button className="member-save-button" disabled={saving}>
                  <Save size={17} />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </form>
            ) : (
              <div className="member-info-list">
                <div className="member-info-row">
                  <div className="member-info-icon"><UserRound size={18} /></div>
                  <div><small>Họ và tên</small><strong>{profile.fullName || "Chưa cập nhật"}</strong></div>
                </div>

                <div className="member-info-row">
                  <div className="member-info-icon"><Mail size={18} /></div>
                  <div><small>Email</small><strong>{profile.email || "Chưa cập nhật"}</strong></div>
                </div>

                <div className="member-info-row">
                  <div className="member-info-icon"><Phone size={18} /></div>
                  <div><small>Số điện thoại</small><strong>{profile.phone || "Chưa cập nhật"}</strong></div>
                </div>

                <div className="member-info-row">
                  <div className="member-info-icon"><CalendarDays size={18} /></div>
                  <div><small>Ngày tham gia</small><strong>{formatDate(profile.joinedAt)}</strong></div>
                </div>
              </div>
            )}

            {message && (
              <p className="member-message">{message}</p>
            )}
          </section>

          <section className="member-panel member-benefits">
            <div className="member-panel-heading">
              <div>
                <span className="member-eyebrow">MEMBERSHIP BENEFITS</span>
                <h2>Quyền lợi thành viên</h2>
              </div>
              <ShieldCheck size={25} className="member-heading-icon" />
            </div>

            <div className="member-benefit-item">
              <span><Star size={18} /></span>
              <div>
                <strong>Tích lũy điểm thưởng</strong>
                <p>Điểm được tính từ các giao dịch thanh toán thành công.</p>
              </div>
            </div>

            <div className="member-benefit-item">
              <span><Ticket size={18} /></span>
              <div>
                <strong>Theo dõi vé đã đặt</strong>
                <p>Xem lại những lần đặt vé gần đây của bạn.</p>
              </div>
            </div>

            <div className="member-benefit-item">
              <Award size={19} />
              <div>
                <strong>Huy hiệu thành tích</strong>
                <p>Mở khóa huy hiệu theo hoạt động đặt vé.</p>
              </div>
            </div>
          </section>
        </div>

        <section className="member-panel member-badges-panel">
          <div className="member-panel-heading">
            <div>
              <span className="member-eyebrow">YOUR ACHIEVEMENTS</span>
              <h2>Huy hiệu của tôi</h2>
              <p className="member-section-description">
                Đã mở khóa {unlockedBadges}/{Number(stats.totalBadges ?? badges.length)} huy hiệu
              </p>
            </div>
            <Award size={27} className="member-heading-icon" />
          </div>

          {badges.length ? (
            <div className="member-badges-grid">
              {badges.map((badge, index) => {
                const unlocked = Boolean(
                  badge.unlocked ?? badge.isUnlocked ?? false
                );

                return (
                  <article
                    className={`member-badge-card ${unlocked ? "unlocked" : "locked"}`}
                    key={badge._id || badge.id || index}
                  >
                    <div className="member-badge-icon">
                      <Award size={27} />
                    </div>
                    <strong>{badge.name || badge.title || `Huy hiệu ${index + 1}`}</strong>
                    <p>{badge.description || "Thành tích thành viên CineGlobe"}</p>
                    <span>{unlocked ? "Đã mở khóa" : "Chưa mở khóa"}</span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="member-empty">
              <Award size={30} />
              <p>Chưa có dữ liệu huy hiệu.</p>
            </div>
          )}
        </section>

        <section className="member-panel member-bookings-panel">
          <div className="member-panel-heading">
            <div>
              <span className="member-eyebrow">BOOKING HISTORY</span>
              <h2>Lịch sử đặt vé gần đây</h2>
            </div>

            <button
              className="member-edit-button"
              onClick={() => navigate("/my-tickets")}
            >
              Xem vé của tôi
            </button>
          </div>

          {bookings.length ? (
            <div className="member-booking-list">
              {bookings.map((booking, index) => {
                const movie = booking.movie || {};
                const cinema = booking.cinema || {};
                const showtime = booking.showtime || {};
                const seatNames = Array.isArray(booking.seats)
                  ? booking.seats.map((seat) =>
                      typeof seat === "string"
                        ? seat
                        : seat.seatNumber || seat.name || ""
                    ).filter(Boolean)
                  : [];

                return (
                  <article
                    className="member-booking-item"
                    key={booking._id || booking.bookingCode || index}
                  >
                    <div className="member-booking-poster">
                      {movie.poster ? (
                        <img src={movie.poster} alt={movie.title || "Phim"} />
                      ) : (
                        <Film size={26} />
                      )}
                    </div>

                    <div className="member-booking-info">
                      <strong>{movie.title || "Phim CineGlobe"}</strong>
                      <span><MapPin size={14} /> {cinema.name || "Rạp chiếu phim"}</span>
                      <span><Clock3 size={14} /> {formatDate(showtime.startTime || booking.createdAt)}</span>
                      <small>
                        Ghế: {seatNames.length ? seatNames.join(", ") : `${booking.totalSeats || 0} ghế`}
                      </small>
                    </div>

                    <div className="member-booking-price">
                      <strong>{formatMoney(booking.totalAmount || booking.finalAmount)}</strong>
                      <span className="member-paid-status">Đã thanh toán</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="member-empty">
              <Ticket size={30} />
              <p>Bạn chưa có lịch sử đặt vé đã thanh toán.</p>
              <button onClick={() => navigate("/")}>Khám phá phim ngay</button>
            </div>
          )}
        </section>

        <footer className="member-footer">
          <span>CineGlobe Membership</span>
          <span>Trải nghiệm điện ảnh theo cách của bạn.</span>
        </footer>
      </main>
    </div>
  );
}

export default ProfilePage;
