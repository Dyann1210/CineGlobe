
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import {
  Film,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  KeyRound,
  RefreshCw,
} from "lucide-react";

import "./App.css";

const API = "http://localhost:5000/api";

function AuthPage() {
  const navigate = useNavigate();
  const path = window.location.pathname;

  const isRegister = path === "/register";
  const isForgot = path === "/forgot-password";

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // TRẠNG THÁI KHÔI PHỤC MẬT KHẨU
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  // CẬP NHẬT FORM
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // LƯU PHIÊN ĐĂNG NHẬP
  const saveLogin = (data) => {
    localStorage.setItem("cineglobeToken", data.token);
    localStorage.setItem("cineglobeUser", JSON.stringify(data.user));

    setSuccess(data.message || "Đăng nhập thành công!");

    setTimeout(() => {
      navigate("/");
      window.location.reload();
    }, 700);
  };

  // ĐĂNG NHẬP GOOGLE
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setSuccess("");

    if (!credentialResponse.credential) {
      setError("Google không trả về thông tin xác thực.");
      return;
    }

    setGoogleLoading(true);

    try {
      const response = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Đăng nhập Google thất bại."
        );
      }

      saveLogin(data);
    } catch (err) {
      setError(err.message || "Không thể kết nối máy chủ.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ĐĂNG NHẬP / ĐĂNG KÝ
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (isRegister && form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "register" : "login";

      const payload = isRegister
        ? {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            password: form.password,
          }
        : {
            email: form.email,
            password: form.password,
          };

      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Có lỗi xảy ra.");
      }

      saveLogin(data);
    } catch (err) {
      setError(err.message || "Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  // GỬI OTP HOẶC ĐẶT LẠI MẬT KHẨU
  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.email.trim()) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }

    // BƯỚC 1: GỬI OTP VỀ EMAIL
    if (forgotStep === 1) {
      setLoading(true);

      try {
        const response = await fetch(
          `${API}/auth/forgot-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: form.email.trim(),
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Không thể gửi mã OTP."
          );
        }

        setForgotStep(2);

        setSuccess(
          data.message ||
            "Yêu cầu đã được tiếp nhận. Nếu email hợp lệ, mã OTP sẽ được gửi đến hộp thư của bạn. Vui lòng kiểm tra cả thư mục Spam."
        );
      } catch (err) {
        setError(
          err.message || "Không thể kết nối máy chủ."
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // KIỂM TRA OTP
    if (!/^\d{6}$/.test(otp)) {
      setError("Mã OTP phải gồm chính xác 6 chữ số.");
      return;
    }

    // KIỂM TRA MẬT KHẨU MỚI
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    // BƯỚC 2: XÁC THỰC OTP VÀ ĐỔI MẬT KHẨU
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email.trim(),
            otp: otp,
            newPassword: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Không thể đặt lại mật khẩu."
        );
      }

      setSuccess(
        data.message ||
          "Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập..."
      );

      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(
        err.message || "Không thể kết nối máy chủ."
      );
    } finally {
      setLoading(false);
    }
  };

  // QUAY LẠI NHẬP EMAIL
  const handleChangeEmail = () => {
    setForgotStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-orb orb-one"></div>
        <div className="auth-orb orb-two"></div>
      </div>

      <Link to="/" className="auth-back">
        <ArrowLeft size={18} /> Trang chủ
      </Link>

      <div className="auth-container">
        <Link to="/" className="auth-brand">
          <span className="brand-icon">C</span>
          <span>
            Cine<span>Globe</span>
          </span>
        </Link>

        <div className="auth-icon">
          {isForgot ? (
            <ShieldCheck size={27} />
          ) : (
            <Film size={27} />
          )}
        </div>

        <p className="eyebrow">CINEGLOBE EXPERIENCE</p>

        <h1>
          {isRegister
            ? "Tạo tài khoản"
            : isForgot
              ? forgotStep === 1
                ? "Quên mật khẩu?"
                : "Xác thực OTP"
              : "Chào mừng trở lại!"}
        </h1>

        <p className="auth-description">
          {isRegister
            ? "Tham gia CineGlobe và khám phá thế giới điện ảnh."
            : isForgot
              ? forgotStep === 1
                ? "Nhập email để nhận mã OTP khôi phục tài khoản."
                : "Nhập mã OTP và tạo mật khẩu mới cho tài khoản của bạn."
              : "Đăng nhập để tiếp tục hành trình điện ảnh của bạn."}
        </p>

        <form
          onSubmit={isForgot ? handleForgotSubmit : handleSubmit}
          className="auth-form"
        >
          {/* THÔNG TIN ĐĂNG KÝ */}
          {isRegister && (
            <>
              <label>Họ và tên</label>

              <div className="auth-input">
                <User size={18} />

                <input
                  name="fullName"
                  placeholder="Nhập họ và tên"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <label>Số điện thoại</label>

              <div className="auth-input">
                <Phone size={18} />

                <input
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* EMAIL */}
          <label>Email</label>

          <div className="auth-input">
            <Mail size={18} />

            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={handleChange}
              disabled={isForgot && forgotStep === 2}
              required
            />
          </div>

          {/* MẬT KHẨU ĐĂNG NHẬP / ĐĂNG KÝ */}
          {!isForgot && (
            <>
              <label>Mật khẩu</label>

              <div className="auth-input">
                <Lock size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </>
          )}

          {/* OTP VÀ MẬT KHẨU MỚI */}
          {isForgot && forgotStep === 2 && (
            <>
              <div className="auth-otp-notice">
                <ShieldCheck size={18} />
                <span>
                  Mã OTP có hiệu lực trong 5 phút.
                  Hãy kiểm tra hộp thư Gmail và thư mục Spam.
                </span>
              </div>

              <label>Mã OTP</label>

              <div className="auth-input">
                <KeyRound size={18} />

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Nhập mã OTP 6 chữ số"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  maxLength={6}
                  required
                />
              </div>

              <label>Mật khẩu mới</label>

              <div className="auth-input">
                <Lock size={18} />

                <input
                  type={
                    showNewPassword ? "text" : "password"
                  }
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <label>Xác nhận mật khẩu mới</label>

              <div className="auth-input">
                <Lock size={18} />

                <input
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <div className="auth-forgot">
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="auth-change-email"
                >
                  <RefreshCw size={14} />
                  Thay đổi email
                </button>
              </div>
            </>
          )}

          {/* QUÊN MẬT KHẨU */}
          {!isRegister && !isForgot && (
            <div className="auth-forgot">
              <Link to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </div>
          )}

          {/* THÔNG BÁO */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          {/* NÚT GỬI */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading || googleLoading}
          >
            {loading
              ? "Đang xử lý..."
              : isRegister
                ? "Tạo tài khoản"
                : isForgot
                  ? forgotStep === 1
                    ? "Gửi mã OTP"
                    : "Đặt lại mật khẩu"
                  : "Đăng nhập"}

            <Sparkles size={17} />
          </button>
        </form>

        {/* GOOGLE LOGIN */}
        {!isForgot && (
          <>
            <div className="auth-social-divider">
              <span></span>
              <small>HOẶC TIẾP TỤC VỚI</small>
              <span></span>
            </div>

            <div className="auth-google-wrapper">
              {googleLoading ? (
                <div className="auth-google-loading">
                  Đang xác thực tài khoản Google...
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setError(
                      "Không thể đăng nhập Google. Vui lòng thử lại."
                    );
                  }}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="320"
                  locale="vi"
                />
              )}
            </div>
          </>
        )}

        {/* CHUYỂN TRANG */}
        <div className="auth-switch">
          {isForgot ? (
            <>
              Nhớ mật khẩu rồi?{" "}
              <Link to="/login">Đăng nhập</Link>
            </>
          ) : isRegister ? (
            <>
              Đã có tài khoản?{" "}
              <Link to="/login">Đăng nhập</Link>
            </>
          ) : (
            <>
              Chưa có tài khoản?{" "}
              <Link to="/register">Đăng ký ngay</Link>
            </>
          )}
        </div>

        <p className="auth-footer">
          © 2026 CineGlobe. Thế giới điện ảnh trong tầm tay.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
