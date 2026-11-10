import { useEffect, useRef, useState } from "react";
import {
    Bot,
    Sparkles,
    X,
    Send,
    Trash2,
    MessageCircle,
    Film,
    CalendarDays,
    Ticket,
    MapPin,
    LoaderCircle
} from "lucide-react";

import "./GlobeAI.css";

const API = "http://localhost:5000/api";

const welcomeMessage = {
    role: "model",
    text: "Xin chào quý khách! 👋 Mình là Globe AI – trợ lý thông minh của CineGlobe.\n\nMình có thể giúp quý khách tìm phim, tra cứu lịch chiếu, tư vấn rạp, thông tin khuyến mãi và hướng dẫn đặt vé.\n\nHôm nay quý khách muốn xem phim gì ạ? 🎬"
};

const suggestions = [
    {
        icon: Film,
        text: "Hiện có những phim nào đang chiếu?"
    },
    {
        icon: CalendarDays,
        text: "Tư vấn lịch chiếu phim hôm nay"
    },
    {
        icon: Ticket,
        text: "Hướng dẫn tôi cách đặt vé"
    },
    {
        icon: MapPin,
        text: "CineGlobe hiện có những rạp nào?"
    }
];

function GlobeAI({ open, onOpen, onClose }) {
    const [messages, setMessages] = useState([welcomeMessage]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

    const sendMessage = async (content) => {
        const text = content.trim();

        if (!text || loading) return;

        const userMessage = {
            role: "user",
            text
        };

        const nextMessages = [...messages, userMessage];

        setMessages(nextMessages);
        setInput("");
        setLoading(true);

        try {
            const token = localStorage.getItem("cineglobeToken");

            const history = messages
                .filter((item) =>
                    item.role === "user" || item.role === "model"
                )
                .slice(-12)
                .map((item) => ({
                    role: item.role,
                    text: item.text
                }));

            const response = await fetch(`${API}/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token
                        ? { Authorization: `Bearer ${token}` }
                        : {})
                },
                body: JSON.stringify({
                    message: text,
                    history
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Không thể kết nối Globe AI."
                );
            }

            setMessages((previous) => [
                ...previous,
                {
                    role: "model",
                    text: result.reply
                }
            ]);

        } catch (error) {
            setMessages((previous) => [
                ...previous,
                {
                    role: "model",
                    text: `Xin lỗi quý khách, ${error.message || "Globe AI đang gặp sự cố."}`
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([welcomeMessage]);
        setInput("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        sendMessage(input);
    };

    const formatMessage = (text) => {
        return text.split("\n").map((line, index) => (
            <span key={index}>
                {line}
                {index !== text.split("\n").length - 1 && <br />}
            </span>
        ));
    };

    return (
        <>
            {!open && (
                <button
                    className="globe-launcher"
                    onClick={onOpen}
                    aria-label="Mở Globe AI"
                >
                    <span className="globe-launcher-pulse"></span>
                    <Sparkles size={25} />
                    <span className="globe-launcher-label">
                        Globe AI
                    </span>
                </button>
            )}

            {open && (
                <section className="globe-chat-window">
                    <header className="globe-chat-header">
                        <div className="globe-header-left">
                            <div className="globe-avatar">
                                <Bot size={25} />
                                <span className="globe-online-dot"></span>
                            </div>

                            <div>
                                <h3>Globe AI</h3>
                                <p>
                                    <span></span>
                                    Trợ lý CineGlobe đang hoạt động
                                </p>
                            </div>
                        </div>

                        <div className="globe-header-actions">
                            <button
                                onClick={clearChat}
                                title="Xóa cuộc trò chuyện"
                            >
                                <Trash2 size={17} />
                            </button>

                            <button
                                onClick={onClose}
                                title="Đóng chat"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </header>

                    <div className="globe-chat-body">
                        <div className="globe-date-label">
                            HỖ TRỢ KHÁCH HÀNG CINEGLOBE
                        </div>

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`globe-message-row ${
                                    message.role === "user"
                                        ? "user-message-row"
                                        : "ai-message-row"
                                }`}
                            >
                                {message.role === "model" && (
                                    <div className="globe-message-avatar">
                                        <Sparkles size={15} />
                                    </div>
                                )}

                                <div
                                    className={`globe-message ${
                                        message.role === "user"
                                            ? "user-message"
                                            : "ai-message"
                                    }`}
                                >
                                    {formatMessage(message.text)}
                                </div>
                            </div>
                        ))}

                        {messages.length === 1 && (
                            <div className="globe-suggestions">
                                <p>QUÝ KHÁCH CÓ THỂ HỎI</p>

                                {suggestions.map((item, index) => {
                                    const Icon = item.icon;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                sendMessage(item.text)
                                            }
                                            disabled={loading}
                                        >
                                            <Icon size={15} />
                                            <span>{item.text}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {loading && (
                            <div className="globe-message-row ai-message-row">
                                <div className="globe-message-avatar">
                                    <Sparkles size={15} />
                                </div>

                                <div className="globe-typing">
                                    <LoaderCircle size={17} />
                                    Globe AI đang suy nghĩ...
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef}></div>
                    </div>

                    <form
                        className="globe-chat-input"
                        onSubmit={handleSubmit}
                    >
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(event) =>
                                setInput(event.target.value)
                            }
                            placeholder="Nhập câu hỏi của quý khách..."
                            maxLength={2000}
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            aria-label="Gửi tin nhắn"
                        >
                            <Send size={19} />
                        </button>
                    </form>

                    <div className="globe-chat-footer">
                        <Sparkles size={12} />
                        Được hỗ trợ bởi Gemini AI
                    </div>
                </section>
            )}
        </>
    );
}

export default GlobeAI;