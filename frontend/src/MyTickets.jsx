
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyTickets.css";

const API_URL = "http://localhost:5000/api";

function formatDate(value) {
  if (!value) return "Chưa có thông tin";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Chưa có thông tin";

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "--:--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
}

function getStatus(status) {
  const value = String(status || "valid").toLowerCase();

  if (["cancelled", "canceled", "refunded"].includes(value)) {
    return { text: "Đã hủy", className: "cancelled" };
  }

  if (["used", "checked-in", "checkedin"].includes(value)) {
    return { text: "Đã sử dụng", className: "used" };
  }

  return { text: "Vé hợp lệ", className: "" };
}

function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("cineglobeToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/tickets/my-tickets`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("cineglobeToken");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách vé.");
      }

      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (err) {
      console.error("Lỗi tải vé:", err);
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const validCount = tickets.filter(
    (ticket) => getStatus(ticket.status).className === ""
  ).length;

  const usedCount = tickets.filter(
    (ticket) => getStatus(ticket.status).className === "used"
  ).length;

  const goHome = () => navigate("/");

  const getPoster = (ticket) => {
    const movie = ticket.movie || {};

    return (
      movie.poster ||
      movie.posterUrl ||
      movie.image ||
      "https://placehold.co/300x450/171d33/ffffff?text=CineGlobe"
    );
  };

  const getSeat = (ticket) => {
    if (ticket.seatNumber) return ticket.seatNumber;

    if (ticket.seat && typeof ticket.seat === "object") {
      return ticket.seat.seatNumber || "Chưa xác định";
    }

    return "Chưa xác định";
  };

  const getSeatType = (ticket) => {
    const type = ticket.seat?.seatType;

    if (type === "vip") return "Ghế VIP";
    if (type === "couple") return "Ghế đôi";

    return "Vé tiêu chuẩn";
  };

  return (
    <div className="my-tickets-page">
      <div className="my-tickets-container">

        {/* HEADER */}
        <header className="my-tickets-header">
          <div className="my-tickets-heading">
            <div className="my-tickets-heading-icon">
              <span style={{ fontSize: 27 }}>🎟️</span>
            </div>

            <div>
              <h1>
                Vé <span>của tôi</span>
              </h1>
              <p>Quản lý và xem lại tất cả vé xem phim của bạn.</p>
            </div>
          </div>

          <div className="my-tickets-actions">
            <button className="my-tickets-btn" onClick={goHome}>
              ← Trang chủ
            </button>

            <button
              className="my-tickets-btn primary"
              onClick={fetchTickets}
              disabled={loading}
            >
              ↻ Làm mới
            </button>
          </div>
        </header>

        {/* LOADING */}
        {loading && (
          <div className="my-tickets-loading">
            <div className="my-tickets-spinner"></div>
            <p>Đang tải vé xem phim...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="my-tickets-error">
            <div style={{ fontSize: 45, marginBottom: 15 }}>⚠️</div>
            <h2>Không thể tải vé</h2>
            <p>{error}</p>

            <button
              className="my-tickets-btn primary"
              onClick={fetchTickets}
            >
              ↻ Thử lại
            </button>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && (
          <>
            {/* STATISTICS */}
            <div className="my-tickets-stats">
              <div className="my-tickets-stat">
                <div className="my-tickets-stat-icon">🎟️</div>
                <div>
                  <strong>{tickets.length}</strong>
                  <span>Tổng số vé</span>
                </div>
              </div>

              <div className="my-tickets-stat">
                <div className="my-tickets-stat-icon">✅</div>
                <div>
                  <strong>{validCount}</strong>
                  <span>Vé hợp lệ</span>
                </div>
              </div>

              <div className="my-tickets-stat">
                <div className="my-tickets-stat-icon">🎬</div>
                <div>
                  <strong>{usedCount}</strong>
                  <span>Vé đã sử dụng</span>
                </div>
              </div>
            </div>

            {/* TITLE */}
            <div className="my-tickets-section-title">
              <div>
                <h2>Danh sách vé của bạn</h2>
                <p>
                  {tickets.length > 0
                    ? `Bạn đang có ${tickets.length} vé trong hệ thống.`
                    : "Các vé đã đặt sẽ xuất hiện tại đây."}
                </p>
              </div>
            </div>

            {/* EMPTY */}
            {tickets.length === 0 && (
              <div className="my-tickets-empty">
                <div className="my-tickets-empty-icon">
                  <span style={{ fontSize: 42 }}>🎫</span>
                </div>

                <h2>Bạn chưa có vé xem phim nào!</h2>

                <p>
                  Hãy khám phá những bộ phim hấp dẫn và đặt vé ngay hôm nay.
                  Vé của bạn sẽ xuất hiện tại đây sau khi đặt thành công.
                </p>

                <button
                  className="my-tickets-btn primary"
                  onClick={goHome}
                >
                  🎬 Khám phá phim ngay
                </button>
              </div>
            )}

            {/* TICKET LIST */}
            {tickets.map((ticket, index) => {
              const movie = ticket.movie || {};
              const showtime = ticket.showtime || {};
              const cinema = ticket.cinema || {};
              const room = ticket.room || {};
              const status = getStatus(ticket.status);

              return (
                <article
                  className="my-ticket-card"
                  key={ticket._id || ticket.ticketCode || index}
                >
                  <div className="my-ticket-main">

                    {/* MOVIE */}
                    <div className="my-ticket-top">
                      <img
                        className="my-ticket-poster"
                        src={getPoster(ticket)}
                        alt={movie.title || "CineGlobe"}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://placehold.co/300x450/171d33/ffffff?text=CineGlobe";
                        }}
                      />

                      <div className="my-ticket-movie">
                        <div className={`my-ticket-status ${status.className}`}>
                          ● {status.text}
                        </div>

                        <h2>{movie.title || "Phim chưa xác định"}</h2>

                        <div className="my-ticket-code">
                          MÃ VÉ: {ticket.ticketCode || ticket._id || "N/A"}
                        </div>

                        <p className="my-ticket-description">
                          Vé điện tử CineGlobe
                        </p>
                      </div>
                    </div>

                    <hr className="my-ticket-divider" />

                    {/* DETAILS */}
                    <div className="my-ticket-info-grid">

                      <div className="my-ticket-info-item">
                        <div className="my-ticket-info-icon">📅</div>
                        <div className="my-ticket-info-text">
                          <span>Ngày chiếu</span>
                          <strong>
                            {formatDate(showtime.startTime || ticket.createdAt)}
                          </strong>
                        </div>
                      </div>

                      <div className="my-ticket-info-item">
                        <div className="my-ticket-info-icon">🕒</div>
                        <div className="my-ticket-info-text">
                          <span>Giờ chiếu</span>
                          <strong>
                            {formatTime(showtime.startTime)}
                            {showtime.endTime
                              ? ` - ${formatTime(showtime.endTime)}`
                              : ""}
                          </strong>
                        </div>
                      </div>

                      <div className="my-ticket-info-item">
                        <div className="my-ticket-info-icon">📍</div>
                        <div className="my-ticket-info-text">
                          <span>Rạp chiếu</span>
                          <strong>{cinema.name || "Chưa xác định"}</strong>
                        </div>
                      </div>

                      <div className="my-ticket-info-item">
                        <div className="my-ticket-info-icon">🎬</div>
                        <div className="my-ticket-info-text">
                          <span>Phòng chiếu</span>
                          <strong>{room.name || "Chưa xác định"}</strong>
                        </div>
                      </div>

                      <div className="my-ticket-info-item">
                        <div className="my-ticket-info-icon">💺</div>
                        <div className="my-ticket-info-text">
                          <span>Ghế ngồi</span>
                          <strong>{getSeat(ticket)}</strong>
                        </div>
                      </div>

                      <div className="my-ticket-info-item">
                        <div className="my-ticket-info-icon">🎟️</div>
                        <div className="my-ticket-info-text">
                          <span>Loại vé</span>
                          <strong>{getSeatType(ticket)}</strong>
                        </div>
                      </div>

                    </div>

                    {/* PRICE */}
                    <div className="my-ticket-price-row">
                      <span>Tổng thanh toán</span>
                      <strong>{formatMoney(ticket.price)}</strong>
                    </div>
                  </div>

                  {/* QR */}
                  <div className="my-ticket-qr">
                    <div className="my-ticket-qr-title">
                      ▦ MÃ QR VÉ ĐIỆN TỬ
                    </div>

                    {ticket.qrCode ? (
                      <img
                        src={ticket.qrCode}
                        alt="QR Code vé xem phim"
                      />
                    ) : (
                      <div
                        style={{
                          width: 155,
                          height: 155,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#fff",
                          color: "#333",
                          borderRadius: 13,
                          fontSize: 12,
                          textAlign: "center",
                          padding: 12,
                        }}
                      >
                        Chưa có mã QR
                      </div>
                    )}

                    <p className="my-ticket-qr-note">
                      Xuất trình mã QR tại quầy soát vé trước khi vào phòng
                      chiếu.
                    </p>

                    <div className="my-ticket-qr-code">
                      {ticket.ticketCode || ""}
                    </div>
                  </div>
                </article>
              );
            })}
          </>
        )}

        <footer className="my-tickets-footer">
          © {new Date().getFullYear()} CineGlobe. Trải nghiệm điện ảnh tuyệt vời.
        </footer>
      </div>
    </div>
  );
}

export default MyTickets;
