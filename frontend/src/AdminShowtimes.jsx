
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock, RefreshCw, Plus, Pencil, Trash2,
  X, Search, Clock, MapPin, Film, DoorOpen, Save
} from "lucide-react";
import "./AdminShowtimes.css";

const API = "http://localhost:5000/api";

const emptyForm = {
  movieId: "",
  cinemaId: "",
  roomId: "",
  startTime: "",
  price: "75000",
  status: "scheduled"
};

const statusLabels = {
  scheduled: "Đã lên lịch",
  ongoing: "Đang chiếu",
  completed: "Đã kết thúc",
  cancelled: "Đã hủy"
};

const money = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
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

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Có lỗi xảy ra.");
  }

  return result;
}

export default function AdminShowtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [showtimeResult, movieResult, cinemaResult, roomResult] =
        await Promise.all([
          apiRequest("/admin/showtimes"),
          apiRequest("/admin/movies"),
          apiRequest("/admin/cinemas"),
          apiRequest("/admin/rooms")
        ]);

      setShowtimes(showtimeResult.showtimes || []);
      setMovies(movieResult.movies || []);
      setCinemas(cinemaResult.data || []);
      setRooms(roomResult.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredShowtimes = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return showtimes.filter((item) => {
      const matchesStatus =
        !filterStatus || item.status === filterStatus;

      const matchesKeyword =
        !search ||
        item.movie?.title?.toLowerCase().includes(search) ||
        item.cinema?.name?.toLowerCase().includes(search) ||
        item.room?.name?.toLowerCase().includes(search);

      return matchesStatus && matchesKeyword;
    });
  }, [showtimes, keyword, filterStatus]);

  const availableRooms = rooms.filter(
    (room) =>
      String(room.cinema?._id || room.cinema) === String(form.cinemaId) &&
      room.isActive !== false
  );

  const setField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);

    setForm({
      movieId: item.movie?._id || "",
      cinemaId: item.cinema?._id || "",
      roomId: item.room?._id || "",
      startTime: toLocalInput(item.startTime),
      price: String(item.price ?? 75000),
      status: item.status || "scheduled"
    });

    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.movieId ||
      !form.cinemaId ||
      !form.roomId ||
      !form.startTime ||
      Number(form.price) < 0
    ) {
      setError("Vui lòng nhập đầy đủ thông tin suất chiếu.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        movieId: form.movieId,
        cinemaId: form.cinemaId,
        roomId: form.roomId,
        startTime: new Date(form.startTime).toISOString(),
        price: Number(form.price),
        status: form.status
      };

      if (editingId) {
        await apiRequest(`/admin/showtimes/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest("/admin/showtimes", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setModalOpen(false);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa suất chiếu "${item.movie?.title || "này"}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await apiRequest(`/admin/showtimes/${item._id}`, {
        method: "DELETE"
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="as-page">
      <div className="as-heading">
        <div>
          <span className="as-eyebrow">CINEGLOBE MANAGEMENT</span>
          <h2>Quản lý suất chiếu</h2>
          <p>Thiết lập lịch chiếu phim tại các rạp CineGlobe.</p>
        </div>

        <div className="as-heading-actions">
          <button className="as-refresh" onClick={loadData}>
            <RefreshCw size={16} />
            Làm mới
          </button>

          <button className="as-add" onClick={openCreate}>
            <Plus size={18} />
            Thêm suất chiếu
          </button>
        </div>
      </div>

      <div className="as-summary">
        <div>
          <CalendarClock />
          <span>Tổng suất chiếu</span>
          <strong>{showtimes.length}</strong>
        </div>
        <div>
          <Clock />
          <span>Đã lên lịch</span>
          <strong>
            {showtimes.filter((s) => s.status === "scheduled").length}
          </strong>
        </div>
        <div>
          <Film />
          <span>Đang chiếu</span>
          <strong>
            {showtimes.filter((s) => s.status === "ongoing").length}
          </strong>
        </div>
        <div>
          <DoorOpen />
          <span>Phòng chiếu</span>
          <strong>{rooms.length}</strong>
        </div>
      </div>

      <div className="as-panel">
        <div className="as-toolbar">
          <div className="as-search">
            <Search size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm tên phim, rạp hoặc phòng..."
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="scheduled">Đã lên lịch</option>
            <option value="ongoing">Đang chiếu</option>
            <option value="completed">Đã kết thúc</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {error && <div className="as-error">{error}</div>}

        {loading ? (
          <div className="as-empty">
            <RefreshCw className="as-spin" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredShowtimes.length === 0 ? (
          <div className="as-empty">
            <CalendarClock size={40} />
            <strong>Chưa có suất chiếu</strong>
            <p>Hãy thêm suất chiếu mới để bắt đầu quản lý.</p>
          </div>
        ) : (
          <div className="as-table-wrap">
            <table className="as-table">
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Rạp chiếu</th>
                  <th>Phòng</th>
                  <th>Thời gian</th>
                  <th>Giá vé</th>
                  <th>Ghế trống</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredShowtimes.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="as-movie">
                        {item.movie?.poster ? (
                          <img src={item.movie.poster} alt="" />
                        ) : (
                          <span><Film size={20} /></span>
                        )}
                        <strong>{item.movie?.title || "Phim đã xóa"}</strong>
                      </div>
                    </td>

                    <td>
                      <div className="as-location">
                        <MapPin size={15} />
                        {item.cinema?.name || "—"}
                      </div>
                      <small>{item.cinema?.city || ""}</small>
                    </td>

                    <td>{item.room?.name || "—"}</td>
                    <td>{formatDate(item.startTime)}</td>
                    <td className="as-price">{money(item.price)}</td>
                    <td>{item.availableSeats ?? "—"}</td>
                    <td>
                      <span className={`as-status ${item.status}`}>
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td>
                      <div className="as-actions">
                        <button
                          title="Chỉnh sửa"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          title="Xóa"
                          className="as-delete"
                          onClick={() => handleDelete(item)}
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

        <div className="as-footer">
          Hiển thị {filteredShowtimes.length}/{showtimes.length} suất chiếu
        </div>
      </div>

      {modalOpen && (
        <div className="as-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}>
          <form className="as-modal" onSubmit={handleSubmit}>
            <div className="as-modal-header">
              <div>
                <span className="as-eyebrow">CINEGLOBE</span>
                <h3>{editingId ? "Cập nhật suất chiếu" : "Thêm suất chiếu mới"}</h3>
              </div>
              <button
                type="button"
                className="as-close"
                onClick={() => setModalOpen(false)}
              >
                <X />
              </button>
            </div>

            <label>Chọn phim</label>
            <select
              required
              value={form.movieId}
              onChange={(e) => setField("movieId", e.target.value)}
            >
              <option value="">-- Chọn phim --</option>
              {movies.map((movie) => (
                <option key={movie._id} value={movie._id}>
                  {movie.title}
                </option>
              ))}
            </select>

            <label>Rạp chiếu</label>
            <select
              required
              value={form.cinemaId}
              onChange={(e) => {
                setField("cinemaId", e.target.value);
                setField("roomId", "");
              }}
            >
              <option value="">-- Chọn rạp --</option>
              {cinemas.map((cinema) => (
                <option key={cinema._id} value={cinema._id}>
                  {cinema.name} - {cinema.city}
                </option>
              ))}
            </select>

            <label>Phòng chiếu</label>
            <select
              required
              value={form.roomId}
              onChange={(e) => setField("roomId", e.target.value)}
            >
              <option value="">-- Chọn phòng --</option>
              {availableRooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name} ({room.roomType})
                </option>
              ))}
            </select>

            <div className="as-form-row">
              <div>
                <label>Ngày và giờ chiếu</label>
                <input
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(e) => setField("startTime", e.target.value)}
                />
              </div>

              <div>
                <label>Giá vé (VNĐ)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                />
              </div>
            </div>

            {editingId && (
              <>
                <label>Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="scheduled">Đã lên lịch</option>
                  <option value="ongoing">Đang chiếu</option>
                  <option value="completed">Đã kết thúc</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </>
            )}

            {error && <div className="as-error">{error}</div>}

            <div className="as-modal-actions">
              <button
                type="button"
                className="as-cancel"
                onClick={() => setModalOpen(false)}
              >
                Hủy
              </button>
              <button type="submit" className="as-add" disabled={saving}>
                {saving ? <RefreshCw className="as-spin" size={17} /> : <Save size={17} />}
                {saving ? "Đang lưu..." : "Lưu suất chiếu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
