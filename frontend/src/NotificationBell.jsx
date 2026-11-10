import { useEffect, useState } from "react";
import {
    Bell,
    CheckCheck,
    Ticket,
    CreditCard,
    Gift,
    Info,
    Clock,
    X
} from "lucide-react";

import "./NotificationBell.css";

const API = "http://localhost:5000/api";

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("cineglobeToken");

    const loadNotifications = async () => {
        if (!token) return;

        try {
            setLoading(true);

            const response = await fetch(`${API}/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Lỗi tải thông báo:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;

        loadNotifications();

        const interval = setInterval(loadNotifications, 30000);

        return () => clearInterval(interval);
    }, [token]);

    const markAsRead = async (id) => {
        try {
            const response = await fetch(`${API}/notifications/${id}/read`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((item) =>
                        item._id === id
                            ? { ...item, isRead: true }
                            : item
                    )
                );

                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Lỗi đánh dấu đã đọc:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch(`${API}/notifications/read-all`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((item) => ({ ...item, isRead: true }))
                );

                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Lỗi đánh dấu tất cả đã đọc:", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "booking":
                return <Ticket size={19} />;

            case "payment":
                return <CreditCard size={19} />;

            case "promotion":
                return <Gift size={19} />;

            case "reminder":
                return <Clock size={19} />;

            default:
                return <Info size={19} />;
        }
    };

    const formatTime = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit"
        });
    };

    if (!token) return null;

    return (
        <div className="notification-wrapper">
            <button
                className="icon-button notification-button"
                onClick={() => {
                    setIsOpen(!isOpen);

                    if (!isOpen) {
                        loadNotifications();
                    }
                }}
                aria-label="Thông báo"
            >
                <Bell size={19} />

                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="notification-overlay"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="notification-dropdown">
                        <div className="notification-header">
                            <div>
                                <h3>Thông báo</h3>
                                <p>
                                    {unreadCount > 0
                                        ? `${unreadCount} thông báo chưa đọc`
                                        : "Bạn đã xem tất cả thông báo"}
                                </p>
                            </div>

                            <button
                                className="notification-close"
                                onClick={() => setIsOpen(false)}
                                aria-label="Đóng"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                className="mark-all-read"
                                onClick={markAllAsRead}
                            >
                                <CheckCheck size={15} />
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}

                        <div className="notification-list">
                            {loading && notifications.length === 0 ? (
                                <div className="notification-empty">
                                    Đang tải thông báo...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="notification-empty">
                                    <Bell size={34} />
                                    <strong>Chưa có thông báo</strong>
                                    <span>
                                        Những cập nhật về đặt vé và thanh toán
                                        sẽ xuất hiện ở đây.
                                    </span>
                                </div>
                            ) : (
                                notifications.map((item) => (
                                    <div
                                        key={item._id}
                                        className={`notification-item ${
                                            !item.isRead ? "unread" : ""
                                        }`}
                                        onClick={() => {
                                            if (!item.isRead) {
                                                markAsRead(item._id);
                                            }
                                        }}
                                    >
                                        <div className={`notification-icon ${item.type}`}>
                                            {getIcon(item.type)}
                                        </div>

                                        <div className="notification-content">
                                            <strong>{item.title}</strong>
                                            <p>{item.message}</p>

                                            <span className="notification-time">
                                                <Clock size={12} />
                                                {formatTime(item.createdAt)}
                                            </span>
                                        </div>

                                        {!item.isRead && (
                                            <span className="unread-dot" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="notification-footer">
                            CineGlobe • Luôn cập nhật cùng bạn
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default NotificationBell;
