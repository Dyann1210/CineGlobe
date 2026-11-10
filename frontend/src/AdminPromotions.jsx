import { useCallback, useEffect, useState } from "react";
import {
  Tag, Plus, Pencil, Trash2, RefreshCw, X,
  Save, CalendarDays, TicketPercent, ToggleLeft,
  ToggleRight, Search, Gift
} from "lucide-react";
import "./AdminPromotions.css";

const API = "http://localhost:5000/api";

const emptyForm = () => {
  const now = new Date();
  const later = new Date();
  later.setDate(later.getDate() + 7);

  const toLocalInput = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  return {
    name: "",
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 10,
    maxDiscount: 0,
    minOrderAmount: 0,
    startDate: toLocalInput(now),
    endDate: toLocalInput(later),
    usageLimit: 0,
    isActive: true
  };
};

const money = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + "đ";

const dateText = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

async function request(path, options = {}) {
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
    throw new Error(result.message || "Không thể thực hiện yêu cầu.");
  }

  return result;
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);

  const showNotice = (message, type = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 3500);
  };

  const loadPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await request("/promotions");
      setPromotions(result.promotions || []);
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const changeField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const startEdit = (item) => {
    const toLocalInput = (value) => {
      const date = new Date(value);
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    setEditing(item);
    setForm({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      discountType: item.discountType || "percentage",
      discountValue: item.discountValue ?? 10,
      maxDiscount: item.maxDiscount ?? 0,
      minOrderAmount: item.minOrderAmount ?? 0,
      startDate: toLocalInput(item.startDate),
      endDate: toLocalInput(item.endDate),
      usageLimit: item.usageLimit ?? 0,
      isActive: item.isActive !== false
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const savePromotion = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      showNotice("Vui lòng nhập tên chương trình.", "error");
      return;
    }

    if (!editing && !form.code.trim()) {
      showNotice("Vui lòng nhập mã khuyến mãi.", "error");
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      showNotice("Ngày kết thúc phải sau ngày bắt đầu.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: Number(form.maxDiscount),
        minOrderAmount: Number(form.minOrderAmount),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        usageLimit: Number(form.usageLimit),
        isActive: form.isActive
      };

      if (!editing) {
        payload.code = form.code.trim().toUpperCase();
      }

      if (editing) {
        await request(`/promotions/${editing._id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        showNotice("Cập nhật chương trình thành công.");
      } else {
        await request("/promotions", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showNotice("Tạo mã khuyến mãi thành công.");
      }

      resetForm();
      await loadPromotions();
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePromotion = async (item) => {
    try {
      await request(`/promotions/${item._id}/toggle`, {
        method: "PATCH"
      });
      showNotice("Đã cập nhật trạng thái khuyến mãi.");
      await loadPromotions();
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const deletePromotion = async (item) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mã ${item.code}?`)) return;

    try {
      await request(`/promotions/${item._id}`, {
        method: "DELETE"
      });
      showNotice("Đã xóa chương trình khuyến mãi.");
      await loadPromotions();
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const filtered = promotions.filter((item) =>
    `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = promotions.filter((item) => item.isActive).length;
  const totalUsage = promotions.reduce(
    (sum, item) => sum + Number(item.usageCount || 0), 0
  );

  return (
    <div className="promotion-admin">
      {notice && (
        <div className={`promotion-notice ${notice.type}`}>
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} aria-label="Đóng">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="promotion-overview">
        <div className="promotion-overview-card">
          <span className="promotion-overview-icon purple"><Tag /></span>
          <div>
            <small>Tổng chương trình</small>
            <strong>{promotions.length}</strong>
          </div>
        </div>

        <div className="promotion-overview-card">
          <span className="promotion-overview-icon green"><Gift /></span>
          <div>
            <small>Đang kích hoạt</small>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="promotion-overview-card">
          <span className="promotion-overview-icon orange"><TicketPercent /></span>
          <div>
            <small>Lượt sử dụng</small>
            <strong>{totalUsage}</strong>
          </div>
        </div>
      </div>

      <section className="promotion-panel">
        <div className="promotion-panel-heading">
          <div>
            <span className="promotion-eyebrow">PROMOTION MANAGEMENT</span>
            <h2>{editing ? "Chỉnh sửa khuyến mãi" : "Tạo chương trình mới"}</h2>
            <p>Thiết lập mã ưu đãi dành cho khách hàng CineGlobe.</p>
          </div>
          {editing && (
            <button className="promotion-cancel" onClick={resetForm}>
              <X size={16} /> Hủy chỉnh sửa
            </button>
          )}
        </div>

        <form className="promotion-form" onSubmit={savePromotion}>
          <label className="promotion-field">
            <span>Tên chương trình *</span>
            <input
              name="name"
              value={form.name}
              onChange={changeField}
              placeholder="Ví dụ: Ưu đãi thành viên"
              required
            />
          </label>

          <label className="promotion-field">
            <span>Mã khuyến mãi {!editing && "*"}</span>
            <input
              name="code"
              value={form.code}
              onChange={changeField}
              placeholder="Ví dụ: CINE20"
              disabled={!!editing}
              required={!editing}
              maxLength={30}
            />
            {editing && <small>Mã đã tạo không thể thay đổi.</small>}
          </label>

          <label className="promotion-field promotion-full">
            <span>Mô tả</span>
            <input
              name="description"
              value={form.description}
              onChange={changeField}
              placeholder="Mô tả ưu đãi dành cho khách hàng..."
            />
          </label>

          <label className="promotion-field">
            <span>Loại giảm giá</span>
            <select name="discountType" value={form.discountType} onChange={changeField}>
              <option value="percentage">Giảm theo phần trăm (%)</option>
              <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
            </select>
          </label>

          <label className="promotion-field">
            <span>Giá trị giảm *</span>
            <input
              type="number"
              name="discountValue"
              min="1"
              max={form.discountType === "percentage" ? 100 : undefined}
              value={form.discountValue}
              onChange={changeField}
              required
            />
          </label>

          <label className="promotion-field">
            <span>Giảm tối đa (0 = không giới hạn)</span>
            <input type="number" name="maxDiscount" min="0" value={form.maxDiscount} onChange={changeField} />
          </label>

          <label className="promotion-field">
            <span>Đơn tối thiểu (VNĐ)</span>
            <input type="number" name="minOrderAmount" min="0" value={form.minOrderAmount} onChange={changeField} />
          </label>

          <label className="promotion-field">
            <span>Thời gian bắt đầu *</span>
            <input type="datetime-local" name="startDate" value={form.startDate} onChange={changeField} required />
          </label>

          <label className="promotion-field">
            <span>Thời gian kết thúc *</span>
            <input type="datetime-local" name="endDate" value={form.endDate} onChange={changeField} required />
          </label>

          <label className="promotion-field">
            <span>Giới hạn lượt dùng (0 = không giới hạn)</span>
            <input type="number" name="usageLimit" min="0" step="1" value={form.usageLimit} onChange={changeField} />
          </label>

          <label className="promotion-active-toggle">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={changeField} />
            <span>Kích hoạt ngay sau khi lưu</span>
          </label>

          <div className="promotion-form-actions promotion-full">
            <button type="submit" disabled={saving}>
              <Save size={17} />
              {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo khuyến mãi"}
            </button>
            <button type="button" className="promotion-reset" onClick={resetForm}>
              Làm mới
            </button>
          </div>
        </form>
      </section>

      <section className="promotion-panel promotion-list-panel">
        <div className="promotion-panel-heading">
          <div>
            <span className="promotion-eyebrow">ALL PROMOTIONS</span>
            <h2>Danh sách khuyến mãi</h2>
            <p>Quản lý trạng thái và lượt sử dụng của từng mã.</p>
          </div>
          <button className="promotion-refresh" onClick={loadPromotions} disabled={loading}>
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>

        <div className="promotion-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mã khuyến mãi..."
          />
        </div>

        {loading ? (
          <div className="promotion-empty">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="promotion-empty">
            <Gift size={35} />
            <strong>Chưa có chương trình khuyến mãi</strong>
            <span>Hãy tạo mã ưu đãi đầu tiên cho CineGlobe.</span>
          </div>
        ) : (
          <div className="promotion-table-wrap">
            <table className="promotion-table">
              <thead>
                <tr>
                  <th>Chương trình</th>
                  <th>Mã</th>
                  <th>Ưu đãi</th>
                  <th>Lượt dùng</th>
                  <th>Thời hạn</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.name}</strong>
                      <small>{item.description || "Không có mô tả"}</small>
                    </td>
                    <td><span className="promotion-code">{item.code}</span></td>
                    <td>
                      <strong className="promotion-discount">
                        {item.discountType === "percentage"
                          ? `${item.discountValue}%`
                          : money(item.discountValue)}
                      </strong>
                      {item.maxDiscount > 0 && (
                        <small>Tối đa {money(item.maxDiscount)}</small>
                      )}
                    </td>
                    <td>
                      {item.usageCount || 0} / {item.usageLimit > 0 ? item.usageLimit : "∞"}
                    </td>
                    <td>
                      <small><CalendarDays size={13} /> {dateText(item.startDate)}</small>
                      <small>đến {dateText(item.endDate)}</small>
                    </td>
                    <td>
                      <span className={`promotion-status ${item.isActive ? "active" : "inactive"}`}>
                        {item.isActive ? "Đang bật" : "Đã tắt"}
                      </span>
                    </td>
                    <td>
                      <div className="promotion-actions">
                        <button title="Chỉnh sửa" onClick={() => startEdit(item)}>
                          <Pencil size={16} />
                        </button>
                        <button
                          title={item.isActive ? "Tạm dừng" : "Kích hoạt"}
                          onClick={() => togglePromotion(item)}
                        >
                          {item.isActive ? <ToggleRight size={19} /> : <ToggleLeft size={19} />}
                        </button>
                        <button className="danger" title="Xóa" onClick={() => deletePromotion(item)}>
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
      </section>
    </div>
  );
}