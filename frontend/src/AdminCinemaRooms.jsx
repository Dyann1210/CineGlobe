
import { useCallback, useEffect, useState } from "react";
import {
  Building2, DoorOpen, Plus, Search, RefreshCw, Pencil,
  Trash2, X, Save, MapPin, Armchair, MonitorPlay,
  CheckCircle2, AlertCircle
} from "lucide-react";
import "./AdminCinemaRooms.css";

const API = "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("cineglobeToken");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || result.error || "Có lỗi xảy ra.");
  }

  return result;
}

const emptyCinema = {
  name: "",
  address: "",
  city: "",
  district: "",
  phone: "",
  description: "",
  image: "",
  facilities: "",
  isActive: true,
};

const emptyRoom = {
  name: "",
  cinema: "",
  roomType: "standard",
  totalRows: 8,
  seatsPerRow: 10,
  screenType: "2D",
  isActive: true,
};

const moneyNumber = (value) =>
  Number(value || 0).toLocaleString("vi-VN");

export default function AdminCinemaRooms({ mode = "cinemas" }) {
  const isCinema = mode === "cinemas";

  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCinema, setFilterCinema] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cinemaForm, setCinemaForm] = useState(emptyCinema);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [toast, setToast] = useState(null);

  const notify = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [cinemaResult, roomResult] = await Promise.all([
        request("/admin/cinemas"),
        request("/admin/rooms"),
      ]);

      setCinemas(
        cinemaResult.cinemas ||
        cinemaResult.data?.cinemas ||
        cinemaResult.data ||
        []
      );

      setRooms(
        roomResult.rooms ||
        roomResult.data?.rooms ||
        roomResult.data ||
        []
      );
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setEditing(null);
    setCinemaForm({ ...emptyCinema });
    setRoomForm({
      ...emptyRoom,
      cinema: cinemas[0]?._id || "",
    });
    setModalOpen(true);
  };

  const openEditCinema = (cinema) => {
    setEditing(cinema);
    setCinemaForm({
      name: cinema.name || "",
      address: cinema.address || "",
      city: cinema.city || "",
      district: cinema.district || "",
      phone: cinema.phone || "",
      description: cinema.description || "",
      image: cinema.image || "",
      facilities: Array.isArray(cinema.facilities)
        ? cinema.facilities.join(", ")
        : "",
      isActive: cinema.isActive !== false,
    });
    setModalOpen(true);
  };

  const openEditRoom = (room) => {
    setEditing(room);
    setRoomForm({
      name: room.name || "",
      cinema: room.cinema?._id || room.cinema || "",
      roomType: room.roomType || "standard",
      totalRows: room.totalRows || 8,
      seatsPerRow: room.seatsPerRow || 10,
      screenType: room.screenType || "2D",
      isActive: room.isActive !== false,
    });
    setModalOpen(true);
  };

  const saveData = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (isCinema) {
        const payload = {
          ...cinemaForm,
          facilities: cinemaForm.facilities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        };

        await request(
          editing
            ? `/admin/cinemas/${editing._id}`
            : "/admin/cinemas",
          {
            method: editing ? "PUT" : "POST",
            body: JSON.stringify(payload),
          }
        );
      } else {
        const payload = {
          ...roomForm,
          totalRows: Number(roomForm.totalRows),
          seatsPerRow: Number(roomForm.seatsPerRow),
        };

        await request(
          editing
            ? `/admin/rooms/${editing._id}`
            : "/admin/rooms",
          {
            method: editing ? "PUT" : "POST",
            body: JSON.stringify(payload),
          }
        );
      }

      notify(editing ? "Cập nhật thành công!" : "Thêm mới thành công!");
      setModalOpen(false);
      setEditing(null);
      await loadData();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    const label = isCinema ? "rạp chiếu phim" : "phòng chiếu";

    if (!window.confirm(`Bạn có chắc muốn xóa ${label} "${item.name}"?`)) {
      return;
    }

    try {
      await request(
        isCinema
          ? `/admin/cinemas/${item._id}`
          : `/admin/rooms/${item._id}`,
        { method: "DELETE" }
      );

      notify("Đã xóa thành công!");
      await loadData();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const filteredItems = (isCinema ? cinemas : rooms).filter((item) => {
    const keyword = search.toLowerCase().trim();

    const matchesSearch = !keyword || [
      item.name,
      item.address,
      item.city,
      item.district,
      item.cinema?.name,
    ].some((value) => String(value || "").toLowerCase().includes(keyword));

    const cinemaId = item.cinema?._id || item.cinema;
    const matchesCinema =
      isCinema || !filterCinema || cinemaId === filterCinema;

    return matchesSearch && matchesCinema;
  });

  const totalSeats = rooms.reduce(
    (sum, room) => sum + Number(room.totalSeats || 0),
    0
  );

  return (
    <div className="acr-page">
      <div className="acr-heading">
        <div>
          <span className="acr-eyebrow">CINEGLOBE MANAGEMENT</span>
          <h2>{isCinema ? "Quản lý rạp chiếu phim" : "Quản lý phòng chiếu"}</h2>
          <p>
            {isCinema
              ? "Quản lý thông tin và hoạt động các cụm rạp."
              : "Quản lý phòng, loại phòng và hệ thống ghế ngồi."}
          </p>
        </div>

        <button className="acr-primary" onClick={openAdd}>
          <Plus size={18} />
          {isCinema ? "Thêm rạp mới" : "Thêm phòng mới"}
        </button>
      </div>

      <div className="acr-stats">
        <div className="acr-stat">
          <span className="acr-stat-icon purple"><Building2 /></span>
          <div><small>Tổng số rạp</small><strong>{cinemas.length}</strong></div>
        </div>

        <div className="acr-stat">
          <span className="acr-stat-icon blue"><DoorOpen /></span>
          <div><small>Tổng số phòng</small><strong>{rooms.length}</strong></div>
        </div>

        <div className="acr-stat">
          <span className="acr-stat-icon pink"><Armchair /></span>
          <div><small>Tổng số ghế</small><strong>{moneyNumber(totalSeats)}</strong></div>
        </div>
      </div>

      <div className="acr-toolbar">
        <div className="acr-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isCinema ? "Tìm theo tên rạp, địa chỉ, thành phố..." : "Tìm theo tên phòng..."}
          />
          {search && (
            <button onClick={() => setSearch("")}><X size={16} /></button>
          )}
        </div>

        {!isCinema && (
          <select
            value={filterCinema}
            onChange={(event) => setFilterCinema(event.target.value)}
          >
            <option value="">Tất cả rạp</option>
            {cinemas.map((cinema) => (
              <option key={cinema._id} value={cinema._id}>
                {cinema.name}
              </option>
            ))}
          </select>
        )}

        <button
          className="acr-refresh"
          onClick={loadData}
          disabled={loading}
          title="Làm mới"
        >
          <RefreshCw size={17} className={loading ? "acr-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="acr-empty">
          <RefreshCw className="acr-spin" size={30} />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="acr-empty">
          {isCinema ? <Building2 size={42} /> : <DoorOpen size={42} />}
          <strong>Chưa có dữ liệu</strong>
          <p>Hãy thêm {isCinema ? "rạp chiếu phim" : "phòng chiếu"} đầu tiên.</p>
        </div>
      ) : (
        <div className="acr-grid">
          {filteredItems.map((item) => (
            <article className="acr-card" key={item._id}>
              <div className="acr-card-top">
                <div className="acr-card-icon">
                  {isCinema ? <Building2 size={25} /> : <MonitorPlay size={25} />}
                </div>
                <span className={item.isActive ? "acr-status active" : "acr-status inactive"}>
                  {item.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                </span>
              </div>

              <h3>{item.name}</h3>

              {isCinema ? (
                <>
                  <p className="acr-description">
                    <MapPin size={15} />
                    {item.address || "Chưa có địa chỉ"}
                  </p>
                  <p className="acr-description">
                    {item.district ? `${item.district}, ` : ""}
                    {item.city || "Chưa cập nhật thành phố"}
                  </p>
                  <div className="acr-card-info">
                    <span><DoorOpen size={16} /> {item.roomCount ?? rooms.filter(r => (r.cinema?._id || r.cinema) === item._id).length} phòng</span>
                    {item.phone && <span>{item.phone}</span>}
                  </div>
                </>
              ) : (
                <>
                  <p className="acr-description">
                    <Building2 size={15} />
                    {item.cinema?.name || cinemas.find(c => c._id === (item.cinema?._id || item.cinema))?.name || "Chưa xác định rạp"}
                  </p>
                  <div className="acr-card-info">
                    <span><Armchair size={16} /> {item.totalSeats || 0} ghế</span>
                    <span>{item.totalRows || 0} hàng × {item.seatsPerRow || 0} ghế</span>
                  </div>
                  <div className="acr-room-tags">
                    <span>{item.roomType?.toUpperCase() || "STANDARD"}</span>
                    <span>{item.screenType || "2D"}</span>
                  </div>
                </>
              )}

              <div className="acr-card-actions">
                <button onClick={() => isCinema ? openEditCinema(item) : openEditRoom(item)}>
                  <Pencil size={16} /> Sửa
                </button>
                <button className="danger" onClick={() => deleteItem(item)}>
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="acr-footer">
        Hiển thị {filteredItems.length} / {isCinema ? cinemas.length : rooms.length} {isCinema ? "rạp" : "phòng"}
      </div>

      {modalOpen && (
        <div className="acr-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setModalOpen(false);
        }}>
          <form className="acr-modal" onSubmit={saveData}>
            <div className="acr-modal-header">
              <div>
                <h3>{editing ? "Cập nhật" : "Thêm"} {isCinema ? "rạp chiếu phim" : "phòng chiếu"}</h3>
                <p>Nhập thông tin bên dưới để lưu dữ liệu.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                <X size={20} />
              </button>
            </div>

            <div className="acr-form-grid">
              {isCinema ? (
                <>
                  <label>Tên rạp *
                    <input required value={cinemaForm.name} onChange={(e) => setCinemaForm({ ...cinemaForm, name: e.target.value })} placeholder="Ví dụ: CineGlobe Biên Hòa" />
                  </label>
                  <label>Thành phố *
                    <input required value={cinemaForm.city} onChange={(e) => setCinemaForm({ ...cinemaForm, city: e.target.value })} placeholder="Đồng Nai" />
                  </label>
                  <label>Quận / Huyện
                    <input value={cinemaForm.district} onChange={(e) => setCinemaForm({ ...cinemaForm, district: e.target.value })} placeholder="Biên Hòa" />
                  </label>
                  <label>Số điện thoại
                    <input value={cinemaForm.phone} onChange={(e) => setCinemaForm({ ...cinemaForm, phone: e.target.value })} placeholder="Số điện thoại liên hệ" />
                  </label>
                  <label className="wide">Địa chỉ *
                    <input required value={cinemaForm.address} onChange={(e) => setCinemaForm({ ...cinemaForm, address: e.target.value })} placeholder="Địa chỉ rạp" />
                  </label>
                  <label className="wide">Ảnh rạp (URL)
                    <input value={cinemaForm.image} onChange={(e) => setCinemaForm({ ...cinemaForm, image: e.target.value })} placeholder="https://..." />
                  </label>
                  <label className="wide">Tiện ích
                    <input value={cinemaForm.facilities} onChange={(e) => setCinemaForm({ ...cinemaForm, facilities: e.target.value })} placeholder="Bãi đỗ xe, Wifi, Đồ ăn (cách nhau bằng dấu phẩy)" />
                  </label>
                  <label className="wide">Mô tả
                    <textarea rows="3" value={cinemaForm.description} onChange={(e) => setCinemaForm({ ...cinemaForm, description: e.target.value })} />
                  </label>
                </>
              ) : (
                <>
                  <label>Tên phòng *
                    <input required value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="Phòng 01" />
                  </label>
                  <label>Rạp chiếu phim *
                    <select required value={roomForm.cinema} onChange={(e) => setRoomForm({ ...roomForm, cinema: e.target.value })}>
                      <option value="">-- Chọn rạp --</option>
                      {cinemas.map((cinema) => <option key={cinema._id} value={cinema._id}>{cinema.name}</option>)}
                    </select>
                  </label>
                  <label>Loại phòng
                    <select value={roomForm.roomType} onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}>
                      <option value="standard">Standard</option>
                      <option value="vip">VIP</option>
                      <option value="couple">Couple</option>
                      <option value="imax">IMAX</option>
                    </select>
                  </label>
                  <label>Loại màn hình
                    <select value={roomForm.screenType} onChange={(e) => setRoomForm({ ...roomForm, screenType: e.target.value })}>
                      <option value="2D">2D</option>
                      <option value="3D">3D</option>
                      <option value="IMAX">IMAX</option>
                      <option value="4DX">4DX</option>
                    </select>
                  </label>
                  <label>Số hàng ghế *
                    <input type="number" min="1" max="26" required disabled={!!editing} value={roomForm.totalRows} onChange={(e) => setRoomForm({ ...roomForm, totalRows: e.target.value })} />
                  </label>
                  <label>Số ghế mỗi hàng *
                    <input type="number" min="1" max="50" required disabled={!!editing} value={roomForm.seatsPerRow} onChange={(e) => setRoomForm({ ...roomForm, seatsPerRow: e.target.value })} />
                  </label>
                  {editing && <p className="acr-hint wide">Không thể đổi kích thước phòng đã tạo vì hệ thống đã sinh ghế. Muốn đổi số ghế, hãy tạo phòng mới.</p>}
                </>
              )}

              <label className="acr-checkbox wide">
                <input
                  type="checkbox"
                  checked={isCinema ? cinemaForm.isActive : roomForm.isActive}
                  onChange={(e) => isCinema
                    ? setCinemaForm({ ...cinemaForm, isActive: e.target.checked })
                    : setRoomForm({ ...roomForm, isActive: e.target.checked })}
                />
                Đang hoạt động
              </label>
            </div>

            <div className="acr-modal-actions">
              <button type="button" className="acr-cancel" onClick={() => setModalOpen(false)} disabled={saving}>Hủy</button>
              <button type="submit" className="acr-primary" disabled={saving}>
                <Save size={17} /> {saving ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className={`acr-toast ${toast.type}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
