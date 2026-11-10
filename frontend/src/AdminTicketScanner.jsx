import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
    ScanLine,
    CheckCircle2,
    XCircle,
    Ticket,
    RefreshCw,
    Camera,
    Search
} from "lucide-react";

import "./AdminTicketScanner.css";

const API = "http://localhost:5000/api";

function formatDate(value) {
    if (!value) return "Chưa cập nhật";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Chưa cập nhật";
    }

    return date.toLocaleString("vi-VN");
}

function AdminTicketScanner() {
    const [ticketCode, setTicketCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const processingRef = useRef(false);
    const lockedRef = useRef(false);

    const checkIn = async (rawCode) => {
        const code = String(rawCode || "").trim();

        if (!code || processingRef.current) return;

        processingRef.current = true;
        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem("cineglobeToken");

            const response = await fetch(
                `${API}/admin/tickets/check-in`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ticketCode: code
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            setResult({
                success: response.ok && data.success,
                message: data.message || "Không thể kiểm tra vé.",
                ticket: data.ticket || null
            });

        } catch (error) {
            setResult({
                success: false,
                message: error.message || "Không thể kết nối máy chủ.",
                ticket: null
            });
        } finally {
            processingRef.current = false;
            setLoading(false);
        }
    };

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "cineglobe-qr-reader",
            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250
                },
                rememberLastUsedCamera: true
            },
            false
        );

        scanner.render(
            (decodedText) => {
                if (lockedRef.current || processingRef.current) return;

                lockedRef.current = true;
                setTicketCode(decodedText);
                checkIn(decodedText);
            },
            () => {}
        );

        return () => {
            scanner.clear().catch(() => {});
        };
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!ticketCode.trim() || loading) return;

        lockedRef.current = true;
        await checkIn(ticketCode);
    };

    const resetScanner = () => {
        lockedRef.current = false;
        setTicketCode("");
        setResult(null);
    };

    const ticket = result?.ticket;

    return (
        <div className="admin-ticket-scanner">
            <div className="ats-heading">
                <div>
                    <span className="ats-eyebrow">
                        CINEGLOBE CHECK-IN
                    </span>

                    <h2>Quét mã QR vé xem phim</h2>

                    <p>
                        Kiểm tra và xác nhận vé điện tử trước khi
                        khách hàng vào phòng chiếu.
                    </p>
                </div>

                <div className="ats-heading-icon">
                    <ScanLine size={30} />
                </div>
            </div>

            <div className="ats-content">
                <section className="ats-scanner-card">
                    <div className="ats-card-heading">
                        <div className="ats-card-icon">
                            <Camera size={20} />
                        </div>

                        <div>
                            <h3>Camera quét mã QR</h3>
                            <p>Đưa mã QR trên vé vào khung quét</p>
                        </div>
                    </div>

                    <div className="ats-camera-area">
                        <div id="cineglobe-qr-reader" />
                    </div>

                    <div className="ats-camera-note">
                        <ScanLine size={17} />
                        <span>
                            Cho phép trình duyệt sử dụng camera
                            nếu được yêu cầu.
                        </span>
                    </div>
                </section>

                <section className="ats-result-column">
                    <div className="ats-manual-card">
                        <div className="ats-card-heading">
                            <div className="ats-card-icon">
                                <Search size={20} />
                            </div>

                            <div>
                                <h3>Nhập mã vé thủ công</h3>
                                <p>Dùng khi không thể quét camera</p>
                            </div>
                        </div>

                        <form
                            className="ats-manual-form"
                            onSubmit={handleSubmit}
                        >
                            <label htmlFor="ats-ticket-code">
                                Mã vé điện tử
                            </label>

                            <input
                                id="ats-ticket-code"
                                type="text"
                                placeholder="Ví dụ: CGT..."
                                value={ticketCode}
                                onChange={(event) => {
                                    setTicketCode(event.target.value);
                                    lockedRef.current = false;
                                }}
                            />

                            <button
                                type="submit"
                                disabled={loading || !ticketCode.trim()}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="ats-spin" size={18} />
                                        Đang kiểm tra...
                                    </>
                                ) : (
                                    <>
                                        <Search size={18} />
                                        Kiểm tra và xác nhận
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="ats-result-card">
                        <div className="ats-card-heading">
                            <div className="ats-card-icon">
                                <Ticket size={20} />
                            </div>

                            <div>
                                <h3>Kết quả kiểm tra</h3>
                                <p>Thông tin vé sau khi quét</p>
                            </div>
                        </div>

                        {!result && (
                            <div className="ats-empty-result">
                                <ScanLine size={42} />
                                <strong>Chưa có thông tin vé</strong>
                                <span>
                                    Quét QR hoặc nhập mã vé để bắt đầu.
                                </span>
                            </div>
                        )}

                        {result && (
                            <div className={
                                result.success
                                    ? "ats-status ats-status-success"
                                    : "ats-status ats-status-error"
                            }>
                                {result.success ? (
                                    <CheckCircle2 size={23} />
                                ) : (
                                    <XCircle size={23} />
                                )}

                                <div>
                                    <strong>
                                        {result.success
                                            ? "VÉ ĐÃ ĐƯỢC XÁC NHẬN"
                                            : "KHÔNG THỂ XÁC NHẬN VÉ"}
                                    </strong>

                                    <p>{result.message}</p>
                                </div>
                            </div>
                        )}

                        {ticket && (
                            <div className="ats-ticket-info">
                                <div className="ats-ticket-code">
                                    <span>MÃ VÉ</span>
                                    <strong>{ticket.ticketCode}</strong>
                                </div>

                                <div className="ats-info-row">
                                    <span>Phim</span>
                                    <strong>
                                        {ticket.movie?.title || "Chưa cập nhật"}
                                    </strong>
                                </div>

                                <div className="ats-info-row">
                                    <span>Rạp</span>
                                    <strong>
                                        {ticket.cinema?.name || "Chưa cập nhật"}
                                    </strong>
                                </div>

                                <div className="ats-info-row">
                                    <span>Phòng chiếu</span>
                                    <strong>
                                        {ticket.room?.name || "Chưa cập nhật"}
                                    </strong>
                                </div>

                                <div className="ats-info-row">
                                    <span>Ghế</span>
                                    <strong>
                                        {ticket.seatNumber ||
                                            ticket.seat?.seatNumber ||
                                            "Chưa cập nhật"}
                                    </strong>
                                </div>

                                <div className="ats-info-row">
                                    <span>Suất chiếu</span>
                                    <strong>
                                        {formatDate(ticket.showtime?.startTime)}
                                    </strong>
                                </div>

                                <div className="ats-info-row">
                                    <span>Khách hàng</span>
                                    <strong>
                                        {ticket.user?.fullName || "Chưa cập nhật"}
                                    </strong>
                                </div>

                                <div className="ats-info-row">
                                    <span>Trạng thái</span>
                                    <strong className={
                                        ticket.status === "used"
                                            ? "ats-used"
                                            : "ats-not-used"
                                    }>
                                        {ticket.status === "used"
                                            ? "Đã sử dụng"
                                            : ticket.status}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {result && (
                            <button
                                type="button"
                                className="ats-reset-button"
                                onClick={resetScanner}
                            >
                                <RefreshCw size={17} />
                                Quét vé tiếp theo
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AdminTicketScanner;
