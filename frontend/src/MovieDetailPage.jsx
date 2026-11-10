
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Star,
  Clock3,
  CalendarDays,
  Clapperboard,
  Users,
  Ticket,
  Film,
  X,
  Sparkles,
  MapPin,
  MessageCircle,
  Send,
  UserRound
} from "lucide-react";
import "./MovieDetailPage.css";

const API = "http://localhost:5000/api";

function getTrailerEmbed(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtube-nocookie.com")
    ) {
      const videoId =
        parsed.searchParams.get("v") ||
        parsed.pathname.split("/").filter(Boolean).pop();

      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
        : url;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");

      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
        : url;
    }

    return url;
  } catch {
    return "";
  }
}

function MovieDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const id = location.pathname
    .split("/")
    .filter(Boolean)[1] || "";

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTrailer, setShowTrailer] = useState(false);

  // Trạng thái đánh giá phim lấy từ MongoDB
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0
  });
  const [myReview, setMyReview] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  // Lấy thông tin phim từ MongoDB
  useEffect(() => {
    let isMounted = true;

    const fetchMovie = async () => {
      if (!id || id === "undefined" || id === "null") {
        setError("Đường dẫn phim không hợp lệ. Vui lòng quay lại trang chủ.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setMovie(null);

        const response = await fetch(
          `${API}/movies/${encodeURIComponent(id)}`
        );

        const result = await response.json();

        if (!response.ok || !result.success || !result.movie) {
          throw new Error(
            result.message || "Không tìm thấy thông tin phim."
          );
        }

        if (isMounted) {
          setMovie(result.movie);
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết phim:", err);

        if (isMounted) {
          setError(
            err.message || "Không thể tải thông tin phim. Vui lòng thử lại."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovie();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Tải danh sách đánh giá và đánh giá của tài khoản hiện tại
  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      setReviewLoading(true);
      setReviewError("");

      try {
        const response = await fetch(
          `${API}/reviews/movie/${encodeURIComponent(id)}`
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Không thể tải đánh giá.");
        }

        if (isMounted) {
          setReviews(result.reviews || []);
          setReviewSummary(result.summary || {
            averageRating: 0,
            totalReviews: 0
          });
        }

        const token = localStorage.getItem("cineglobeToken");

        if (token) {
          const myResponse = await fetch(
            `${API}/reviews/movie/${encodeURIComponent(id)}/my-review`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const myResult = await myResponse.json();

          if (myResponse.ok && myResult.success && isMounted) {
            setMyReview(myResult.review || null);

            if (myResult.review) {
              setSelectedRating(myResult.review.rating);
              setReviewComment(myResult.review.comment || "");
            } else {
              setSelectedRating(5);
              setReviewComment("");
            }
          }
        } else if (isMounted) {
          setMyReview(null);
          setSelectedRating(5);
          setReviewComment("");
        }
      } catch (err) {
        console.error("Lỗi tải đánh giá:", err);

        if (isMounted) {
          setReviewError(err.message || "Không thể tải đánh giá phim.");
        }
      } finally {
        if (isMounted) {
          setReviewLoading(false);
        }
      }
    };

    if (id) {
      loadReviews();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);
  // Gửi hoặc cập nhật đánh giá lên MongoDB
  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("cineglobeToken");

    if (!token) {
      alert("Vui lòng đăng nhập để đánh giá phim.");
      navigate("/login");
      return;
    }

    if (!reviewComment.trim() || reviewComment.trim().length < 3) {
      setReviewError("Bạn hãy nhập bình luận ít nhất 3 ký tự.");
      return;
    }

    if (reviewComment.trim().length > 1000) {
      setReviewError("Bình luận không được vượt quá 1000 ký tự.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");
      setReviewSuccess("");

      const response = await fetch(
        `${API}/reviews/movie/${encodeURIComponent(id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            rating: selectedRating,
            comment: reviewComment.trim()
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể gửi đánh giá.");
      }

      setMyReview(result.review);
      setReviewSuccess(result.message || "Đánh giá đã được lưu!");

      // Tải lại danh sách và điểm trung bình từ MongoDB
      const listResponse = await fetch(
        `${API}/reviews/movie/${encodeURIComponent(id)}`
      );
      const listResult = await listResponse.json();

      if (listResponse.ok && listResult.success) {
        setReviews(listResult.reviews || []);
        setReviewSummary(listResult.summary || {
          averageRating: 0,
          totalReviews: 0
        });
      }
    } catch (err) {
      console.error("Lỗi gửi đánh giá:", err);
      setReviewError(err.message || "Không thể gửi đánh giá.");
    } finally {
      setReviewSubmitting(false);
    }
  };
  // Chuyển đến trang đặt vé
  const handleBooking = () => {
    if (!movie?._id) {
      alert("Không tìm thấy mã phim. Vui lòng thử lại.");
      return;
    }

    // Chỉ phim đang chiếu mới được đặt vé
    if (movie.status !== "now_showing") {
      alert(
        movie.status === "ended"
          ? "Phim đã kết thúc. Bạn không thể đặt vé!"
          : "Phim chưa khởi chiếu. Bạn chưa thể đặt vé lúc này!"
      );
      return;
    }

    const token = localStorage.getItem("cineglobeToken");

    if (!token) {
      navigate("/login");
      return;
    }

    navigate(`/booking/${movie._id}`);
  };

  // Định dạng ngày phát hành
  const formatDate = (date) => {
    if (!date) return "Đang cập nhật";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Đang cập nhật";
    }

    return parsed.toLocaleDateString("vi-VN");
  };

  // Định dạng thời lượng
  const formatDuration = (duration) => {
    if (!duration) return "Đang cập nhật";

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return hours > 0
      ? `${hours} giờ ${minutes} phút`
      : `${minutes} phút`;
  };

  const trailerUrl = getTrailerEmbed(movie?.trailer);

  const isVideoFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(
    movie?.trailer || ""
  );

  const isNowShowing = movie?.status === "now_showing";
  const isEnded = movie?.status === "ended";

  // Màn hình loading
  if (loading) {
    return (
      <div className="movie-detail-loading">
        <div className="cinema-loader">
          <Film size={42} />
        </div>
        <p>Đang chuẩn bị trải nghiệm điện ảnh...</p>
      </div>
    );
  }

  // Màn hình lỗi
  if (error || !movie) {
    return (
      <div className="movie-detail-error">
        <Film size={55} />
        <h2>Không tìm thấy phim</h2>
        <p>{error || "Thông tin phim hiện không khả dụng."}</p>

        <button onClick={() => navigate("/")}>
          <ArrowLeft size={18} />
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="movie-detail-page">

      {/* HERO BACKDROP */}
      <section className="detail-hero">
        <div
          className="detail-backdrop"
          style={{
            backgroundImage: `url("${movie.backdrop || movie.poster || ""}")`
          }}
        />

        <div className="detail-hero-overlay" />
        <div className="detail-glow detail-glow-one" />
        <div className="detail-glow detail-glow-two" />

        <button
          className="detail-back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={19} />
          <span>Quay lại</span>
        </button>

        <div className="detail-hero-content">
          <div className="detail-poster-wrap">
            <img
              src={movie.poster || movie.backdrop}
              alt={movie.title}
              className="detail-poster"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div className="poster-glow" />
          </div>

          <div className="detail-main-info">
            <div className="detail-eyebrow">
              <Sparkles size={15} />
              CINEGLOBE EXPERIENCE
            </div>

            <h1>{movie.title}</h1>

            <div className="detail-rating-row">
              <span className="detail-rating">
                <Star size={17} fill="currentColor" />
                {Number(movie.rating || 0).toFixed(1)}/10
              </span>

              <span className="detail-age">
                {movie.ageRating || "P"}
              </span>

              <span className="detail-duration">
                <Clock3 size={16} />
                {formatDuration(movie.duration)}
              </span>
            </div>

            <div className="detail-genres">
              {(movie.genres || []).map((genre, index) => (
                <span key={`${genre}-${index}`}>
                  {genre}
                </span>
              ))}
            </div>

            <p className="detail-description">
              {movie.description ||
                "Thông tin nội dung phim đang được cập nhật."}
            </p>

            <div className="detail-actions">
              {isNowShowing ? (
                <button
                  className="detail-book-button"
                  onClick={handleBooking}
                >
                  <Ticket size={19} />
                  ĐẶT VÉ NGAY
                </button>
              ) : (
                <div className="detail-coming-soon-label">
                  <CalendarDays size={19} />
                  {isEnded ? "ĐÃ KẾT THÚC" : "SẮP KHỞI CHIẾU"}
                </div>
              )}

              {movie.trailer && (
                <button
                  className="detail-trailer-button"
                  onClick={() => setShowTrailer(true)}
                >
                  <Play size={18} fill="currentColor" />
                  Xem trailer
                </button>
              )}
            </div>

            <div className="detail-location">
              <MapPin size={15} />
              Trải nghiệm điện ảnh cùng CineGlobe
            </div>
          </div>
        </div>

        <div className="detail-scroll-indicator">
          <span>KHÁM PHÁ PHIM</span>
          <div />
        </div>
      </section>

      {/* MOVIE INFORMATION */}
      <section className="detail-information">
        <div className="detail-section-heading">
          <span>DISCOVER THE MOVIE</span>
          <h2>Thông tin phim</h2>
          <p>Khám phá những thông tin thú vị về bộ phim.</p>
        </div>

        <div className="detail-info-grid">
          <div className="detail-info-card">
            <div className="detail-info-icon purple">
              <Clapperboard />
            </div>
            <span>ĐẠO DIỄN</span>
            <strong>{movie.director || "Đang cập nhật"}</strong>
          </div>

          <div className="detail-info-card">
            <div className="detail-info-icon pink">
              <CalendarDays />
            </div>
            <span>NGÀY PHÁT HÀNH</span>
            <strong>{formatDate(movie.releaseDate)}</strong>
          </div>

          <div className="detail-info-card">
            <div className="detail-info-icon blue">
              <Clock3 />
            </div>
            <span>THỜI LƯỢNG</span>
            <strong>{formatDuration(movie.duration)}</strong>
          </div>

          <div className="detail-info-card">
            <div className="detail-info-icon orange">
              <Star />
            </div>
            <span>ĐÁNH GIÁ</span>
            <strong>
              {Number(movie.rating || 0).toFixed(1)}/10
            </strong>
          </div>
        </div>

        {/* CAST */}
        <div className="detail-cast-section">
          <div className="cast-heading">
            <Users size={22} />

            <div>
              <h3>Diễn viên</h3>
              <p>Những gương mặt góp mặt trong bộ phim</p>
            </div>
          </div>

          <div className="cast-list">
            {movie.cast?.length > 0 ? (
              movie.cast.map((actor, index) => (
                <div
                  className="cast-item"
                  key={`${actor}-${index}`}
                >
                  <div className="cast-avatar">
                    {actor?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span>{actor}</span>
                </div>
              ))
            ) : (
              <p className="cast-empty">
                Thông tin diễn viên đang được cập nhật.
              </p>
            )}
          </div>
        </div>

        {/* MOVIE REVIEWS - DU LIEU TU MONGODB */}
        <section className="movie-review-section">
          <div className="review-heading">
            <span className="review-eyebrow">CINEGLOBE COMMUNITY</span>
            <h2>Đánh giá từ khán giả</h2>
            <p>Chia sẻ cảm nhận của bạn và khám phá ý kiến từ những người xem khác.</p>
          </div>

          <div className="review-overview">
            <div className="review-score-box">
              <strong className="review-average">
                {Number(reviewSummary.averageRating || 0).toFixed(1)}
                <span>/5</span>
              </strong>

              <div className="review-average-stars" aria-label="Điểm trung bình">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={19}
                    fill={
                      star <= Math.round(reviewSummary.averageRating || 0)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>

              <span className="review-total">
                {reviewSummary.totalReviews} lượt đánh giá
              </span>
            </div>

            <div className="review-overview-note">
              <MessageCircle size={25} />
              <div>
                <strong>Góc nhìn của khán giả</strong>
                <p>
                  Điểm số được tính từ những đánh giá thực tế đã lưu trong hệ thống.
                </p>
              </div>
            </div>
          </div>

          <div className="review-form-card">
            <div className="review-form-title">
              <div className="review-form-icon">
                <Star size={21} />
              </div>
              <div>
                <h3>{myReview ? "Cập nhật đánh giá của bạn" : "Bạn nghĩ gì về bộ phim?"}</h3>
                <p>
                  {myReview
                    ? "Bạn đã đánh giá phim này. Có thể chỉnh sửa nội dung bên dưới."
                    : "Chọn số sao và viết cảm nhận của bạn."}
                </p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <label className="review-field-label">Mức độ yêu thích</label>

              <div className="review-star-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`review-star-button ${star <= selectedRating ? "active" : ""}`}
                    onClick={() => setSelectedRating(star)}
                    aria-label={`Đánh giá ${star} sao`}
                    title={`${star} sao`}
                  >
                    <Star
                      size={30}
                      fill={star <= selectedRating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
                <span className="review-rating-label">
                  {selectedRating}/5 sao
                </span>
              </div>

              <label className="review-field-label" htmlFor="movie-review-comment">
                Bình luận của bạn
              </label>

              <textarea
                id="movie-review-comment"
                className="review-comment-input"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Hãy chia sẻ cảm nhận về nội dung, diễn xuất, hình ảnh..."
                maxLength={1000}
                rows={4}
              />

              <div className="review-form-footer">
                <span>{reviewComment.length}/1000 ký tự</span>
                <button
                  type="submit"
                  className="review-submit-button"
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? (
                    <span>Đang gửi...</span>
                  ) : (
                    <>
                      <Send size={17} />
                      {myReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                    </>
                  )}
                </button>
              </div>
            </form>

            {reviewError && (
              <div className="review-message error">{reviewError}</div>
            )}

            {reviewSuccess && (
              <div className="review-message success">{reviewSuccess}</div>
            )}

            {!localStorage.getItem("cineglobeToken") && (
              <p className="review-login-hint">
                Bạn cần <button type="button" onClick={() => navigate("/login")}>đăng nhập</button> để gửi đánh giá.
              </p>
            )}
          </div>

          <div className="review-list-heading">
            <div>
              <h3>Nhận xét của khán giả</h3>
              <p>{reviewSummary.totalReviews} đánh giá được ghi nhận</p>
            </div>
          </div>

          {reviewLoading ? (
            <div className="review-empty-state">
              <div className="review-loading-spinner" />
              <p>Đang tải đánh giá...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-card" key={review._id}>
                  <div className="review-avatar">
                    {review.user?.avatar ? (
                      <img src={review.user.avatar} alt={review.user.fullName || "Khán giả"} />
                    ) : (
                      <UserRound size={23} />
                    )}
                  </div>

                  <div className="review-card-content">
                    <div className="review-card-top">
                      <div>
                        <strong>{review.user?.fullName || "Khán giả CineGlobe"}</strong>
                        <div className="review-card-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              fill={star <= review.rating ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                      </div>

                      <time>
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString("vi-VN")
                          : ""}
                      </time>
                    </div>

                    <p className="review-card-comment">{review.comment}</p>

                    {review.isEdited && (
                      <span className="review-edited-label">Đã chỉnh sửa</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="review-empty-state">
              <MessageCircle size={35} />
              <h3>Chưa có đánh giá nào</h3>
              <p>Hãy là người đầu tiên chia sẻ cảm nhận về bộ phim này!</p>
            </div>
          )}
        </section>
        {/* BOTTOM BOOKING */}
        <div className="detail-bottom-cta">
          <div>
            <span>YOUR NEXT CINEMA EXPERIENCE</span>
            <h2>
              {isNowShowing
                ? "Sẵn sàng cho một chuyến phiêu lưu?"
                : isEnded
                  ? "Bộ phim đã kết thúc"
                  : "Hãy chờ ngày bộ phim ra mắt nhé!"}
            </h2>
            <p>
              {isNowShowing
                ? "Chọn suất chiếu và đặt chỗ ngồi yêu thích của bạn ngay hôm nay."
                : isEnded
                  ? "Cảm ơn bạn đã quan tâm đến bộ phim này."
                  : "CineGlobe sẽ cập nhật lịch chiếu ngay khi bộ phim khởi chiếu."}
            </p>
          </div>

          {isNowShowing ? (
            <button onClick={handleBooking}>
              <Ticket size={19} />
              Đặt vé ngay
            </button>
          ) : (
            <span className="detail-coming-soon-label">
              <CalendarDays size={19} />
              {isEnded ? "ĐÃ KẾT THÚC" : "SẮP KHỞI CHIẾU"}
            </span>
          )}
        </div>
      </section>

      {/* TRAILER MODAL */}
      {showTrailer && movie.trailer && (
        <div
          className="trailer-overlay"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="trailer-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="trailer-header">
              <div>
                <Play size={18} />
                <strong>TRAILER - {movie.title}</strong>
              </div>

              <button
                onClick={() => setShowTrailer(false)}
                aria-label="Đóng trailer"
              >
                <X size={23} />
              </button>
            </div>

            {isVideoFile ? (
              <video
                src={movie.trailer}
                controls
                autoPlay
              />
            ) : (
              <iframe
                src={trailerUrl}
                title={`Trailer ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetailPage;

