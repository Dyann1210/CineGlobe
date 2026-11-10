
import { useCallback, useEffect, useState } from "react";
import {
  Search, RefreshCw, CreditCard, CheckCircle2,
  Clock, XCircle, RotateCcw, Receipt
} from "lucide-react";
import "./AdminPayments.css";

const API = "http://localhost:5000/api";

const money = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";

const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("vi-VN")
    : "Chưa thanh toán";

const methodName = {
  cash: "Tiền mặt",
  momo: "MoMo",
  vnpay: "VNPay",
  zalopay: "ZaloPay",
  banking: "Chuyển khoản"
};

const statusInfo = {
  pending: { label: "Đang chờ", icon: Clock },
  success: { label: "Thành công", icon: CheckCircle2 },
  failed: { label: "Thất bại", icon: XCircle },
  refunded: { label: "Đã hoàn tiền", icon: RotateCcw }
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("cineglobeToken");
      const params = new URLSearchParams();

      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (status) params.set("status", status);
      if (paymentMethod) params.set("paymentMethod", paymentMethod);

      const response = await fetch(
        `${API}/admin/payments?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải giao dịch.");
      }

      setPayments(result.payments || []);
    } catch (err) {
      setError(err.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, status, paymentMethod]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totalAmount = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const countStatus = (value) =>
    payments.filter((p) => p.status === value).length;

  return (
    <div className="ap-page">
      <div className="ap-heading">
        <div>
          <span className="ap-eyebrow">CINEGLOBE MANAGEMENT</span>
          <h2>Quản lý thanh toán</h2>
          <p>Theo dõi giao dịch và tình trạng thanh toán vé xem phim.</p>
        </div>

        <button className="ap-refresh" onClick={loadPayments}>
          <RefreshCw size={17} />
          Làm mới
        </button>
      </div>

      <div className="ap-stats">
        <div className="ap-stat">
          <span className="ap-stat-icon purple"><Receipt /></span>
          <div>
            <small>Tổng giao dịch</small>
            <strong>{payments.length}</strong>
          </div>
        </div>

        <div className="ap-stat">
          <span className="ap-stat-icon green"><CheckCircle2 /></span>
          <div>
            <small>Thành công</small>
            <strong>{countStatus("success")}</strong>
          </div>
        </div>

        <div className="ap-stat">
          <span className="ap-stat-icon orange"><Clock /></span>
          <div>
            <small>Đang chờ</small>
            <strong>{countStatus("pending")}</strong>
          </div>
        </div>

        <div className="ap-stat">
          <span className="ap-stat-icon blue"><CreditCard /></span>
          <div>
            <small>Doanh thu thành công</small>
            <strong>{money(totalAmount)}</strong>
          </div>
        </div>
      </div>

      <div className="ap-panel">
        <div className="ap-toolbar">
          <div className="ap-search">
            <Search size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm mã giao dịch, mã đặt vé, khách hàng..."
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="success">Thành công</option>
            <option value="failed">Thất bại</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Tất cả phương thức</option>
            <option value="cash">Tiền mặt</option>
            <option value="momo">MoMo</option>
            <option value="vnpay">VNPay</option>
            <option value="zalopay">ZaloPay</option>
            <option value="banking">Chuyển khoản</option>
          </select>
        </div>

        {error && <div className="ap-error">{error}</div>}

        {loading ? (
          <div className="ap-empty">
            <RefreshCw className="ap-spin" size={25} />
            <p>Đang tải giao dịch...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="ap-empty">
            <Receipt size={38} />
            <strong>Chưa có giao dịch</strong>
            <p>Không tìm thấy dữ liệu phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Mã giao dịch</th>
                  <th>Khách hàng</th>
                  <th>Mã đặt vé</th>
                  <th>Phương thức</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const info = statusInfo[payment.status] || statusInfo.pending;
                  const StatusIcon = info.icon;

                  return (
                    <tr key={payment._id}>
                      <td>
                        <strong className="ap-code">
                          {payment.transactionCode}
                        </strong>
                      </td>
                      <td>
                        <strong>{payment.user?.fullName || "Khách hàng"}</strong>
                        <small>{payment.user?.email || "—"}</small>
                      </td>
                      <td>{payment.booking?.bookingCode || "—"}</td>
                      <td>
                        {methodName[payment.paymentMethod] || payment.paymentMethod}
                      </td>
                      <td className="ap-money">{money(payment.amount)}</td>
                      <td>
                        <span className={`ap-status ${payment.status}`}>
                          <StatusIcon size={14} />
                          {info.label}
                        </span>
                      </td>
                      <td>{dateTime(payment.paidAt || payment.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="ap-footer">
          Hiển thị {payments.length} giao dịch
          <span>Dữ liệu lấy trực tiếp từ MongoDB Atlas</span>
        </div>
      </div>
    </div>
  );
}
