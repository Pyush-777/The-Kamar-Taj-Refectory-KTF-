import { useEffect, useState } from "react";
import {
    CalendarDays,
    Ticket,
    XCircle,
    RefreshCw,
    Download,
    CheckCircle2,
    Clock,
    AlertTriangle,
    IndianRupee,
    Utensils
} from "lucide-react";
import api from "./api";

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [cancelId, setCancelId] = useState("");
    const [filterTab, setFilterTab] = useState("active"); // "active", "history"
    const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);

    async function fetchBookings() {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/bookings/my");
            const data = response.data;
            setBookings(Array.isArray(data) ? data : data.bookings || []);
        } catch (err) {
            setError(err.response?.data?.message || "Could not load your bookings.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBookings(); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    async function confirmCancelBooking() {
        if (!selectedBookingForCancel) return;

        const bookingId = selectedBookingForCancel._id;
        setCancelId(bookingId);
        setMessage("");
        setError("");

        try {
            const response = await api.patch(`/bookings/${bookingId}/cancel`);
            setMessage(response.data.message || "Booking cancelled and rebate credited.");
            setSelectedBookingForCancel(null);
            await fetchBookings();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to cancel this booking.");
        } finally {
            setCancelId("");
        }
    }

    function formatDate(date) {
        if (!date) return "Date not specified";

        return new Date(date).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function formatTime(date) {
        if (!date) return "";
        return new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // Download QR Code as image
    const downloadQR = (booking) => {
        if (!booking.qrCode) return;
        const link = document.createElement("a");
        link.href = booking.qrCode;
        const mealName = booking.meal?.mealType || "meal";
        const dateStr = booking.meal?.date ? new Date(booking.meal.date).toISOString().slice(0, 10) : "pass";
        link.download = `KamarTaj-Refectory-${mealName}-${dateStr}.png`;
        link.click();
    };

    const activeBookings = bookings.filter((b) => b.status === "booked");
    const historyBookings = bookings.filter((b) => b.status !== "booked");

    const displayedBookings = filterTab === "active" ? activeBookings : historyBookings;

    return (
        <section className="my-bookings-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">STUDENT MEAL PASSES</p>
                    <h1>My Bookings & QR Access Passes</h1>
                    <p className="muted-text">
                        Present your digital QR code at the refectory entrance turnstile for automated check-in.
                    </p>
                </div>

                <div className="heading-actions">
                    <button
                        className="secondary-button"
                        onClick={fetchBookings}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="tab-bar">
                <button
                    className={`tab-btn ${filterTab === "active" ? "active" : ""}`}
                    onClick={() => setFilterTab("active")}
                >
                    <Ticket size={16} />
                    Active QR Passes ({activeBookings.length})
                </button>

                <button
                    className={`tab-btn ${filterTab === "history" ? "active" : ""}`}
                    onClick={() => setFilterTab("history")}
                >
                    <Clock size={16} />
                    Dining History ({historyBookings.length})
                </button>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="empty-state">
                    <div className="spinner" />
                    <p>Loading your reservation passes...</p>
                </div>
            ) : displayedBookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Ticket size={32} />
                    </div>
                    <h3>
                        {filterTab === "active"
                            ? "No Active Meal Passes"
                            : "No Past Dining History"}
                    </h3>
                    <p>
                        {filterTab === "active"
                            ? "You do not have any upcoming meal reservations. Visit the Meal Menu to reserve your dining seat."
                            : "Past check-ins, cancellations, and rebates will appear here."}
                    </p>
                </div>
            ) : (
                <div className="pass-grid">
                    {displayedBookings.map((booking) => {
                        const meal = booking.meal || {};
                        const status = booking.status || "booked";
                        const isRedeemed = status === "redeemed";
                        const isCancelled = status === "cancelled";

                        return (
                            <article
                                className={`pass-card ${status}`}
                                key={booking._id}
                            >
                                <div className="pass-header">
                                    <div className="pass-type-badge">
                                        <Utensils size={16} />
                                        <span>
                                            {(meal.mealType || "Meal").toUpperCase()}
                                        </span>
                                    </div>

                                    <span className={`status-pill ${status}`}>
                                        {status === "redeemed" && <CheckCircle2 size={13} />}
                                        {status === "cancelled" && <XCircle size={13} />}
                                        {status}
                                    </span>
                                </div>

                                <div className="pass-body">
                                    {/* QR Code Presentation Box */}
                                    <div className="qr-container">
                                        {booking.qrCode ? (
                                            <div className="qr-box">
                                                <img
                                                    src={booking.qrCode}
                                                    alt="Meal Booking QR Code"
                                                    className="qr-img"
                                                />
                                                {status === "booked" && (
                                                    <span className="qr-watermark">
                                                        Scan at Entrance
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="qr-placeholder">
                                                <Ticket size={32} />
                                                <span>QR Code Processing</span>
                                            </div>
                                        )}

                                        {status === "booked" && booking.qrCode && (
                                            <button
                                                className="qr-download-btn"
                                                onClick={() => downloadQR(booking)}
                                                title="Save pass to phone"
                                            >
                                                <Download size={14} />
                                                Save Pass
                                            </button>
                                        )}
                                    </div>

                                    {/* Pass Details */}
                                    <div className="pass-details">
                                        <div className="detail-row">
                                            <CalendarDays size={16} className="detail-icon" />
                                            <div>
                                                <small>Meal Date</small>
                                                <strong>{formatDate(meal.date)}</strong>
                                            </div>
                                        </div>

                                        {meal.serviceWindow && (
                                            <div className="detail-row">
                                                <Clock size={16} className="detail-icon" />
                                                <div>
                                                    <small>Dining Window</small>
                                                    <strong>
                                                        {meal.serviceWindow.start} - {meal.serviceWindow.end}
                                                    </strong>
                                                </div>
                                            </div>
                                        )}

                                        <div className="detail-row">
                                            <Ticket size={16} className="detail-icon" />
                                            <div>
                                                <small>Booking Verification Code</small>
                                                <code className="pass-code">
                                                    {booking.bookingCode
                                                        ? `${booking.bookingCode.slice(0, 16)}...`
                                                        : "Generated"}
                                                </code>
                                            </div>
                                        </div>

                                        {meal.menu?.length > 0 && (
                                            <div className="pass-menu-snippet">
                                                <small>Menu Items:</small>
                                                <p>{meal.menu.join(" • ")}</p>
                                            </div>
                                        )}

                                        {/* Status Audit Stamps */}
                                        {isRedeemed && (
                                            <div className="pass-audit verified">
                                                <CheckCircle2 size={16} />
                                                <span>
                                                    Redeemed at entrance on {formatDate(booking.redeemedAt)}{" "}
                                                    {formatTime(booking.redeemedAt)}
                                                </span>
                                            </div>
                                        )}

                                        {isCancelled && (
                                            <div className="pass-audit cancelled">
                                                <IndianRupee size={16} />
                                                <span>
                                                    Cancelled on {formatDate(booking.cancelledAt)}. Rebate credited: ₹
                                                    {booking.rebateCredited || 45}
                                                </span>
                                            </div>
                                        )}

                                        {/* Cancel Action */}
                                        {status === "booked" && (
                                            <div className="pass-footer-actions">
                                                <button
                                                    className="danger-button cancel-pass-btn"
                                                    onClick={() => setSelectedBookingForCancel(booking)}
                                                    disabled={cancelId === booking._id}
                                                >
                                                    <XCircle size={15} />
                                                    Cancel for Rebate (₹{meal.rebateAmount || 45})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {selectedBookingForCancel && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="modal-title-with-icon">
                                <AlertTriangle size={24} className="text-amber" />
                                <h3>Cancel Meal Reservation?</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setSelectedBookingForCancel(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <p>
                                Are you sure you want to cancel your{" "}
                                <strong>
                                    {selectedBookingForCancel.meal?.mealType?.toUpperCase()}
                                </strong>{" "}
                                reservation for{" "}
                                <strong>
                                    {formatDate(selectedBookingForCancel.meal?.date)}
                                </strong>
                                ?
                            </p>

                            <div className="rebate-info-box">
                                <IndianRupee size={20} className="text-emerald" />
                                <div>
                                    <strong>
                                        ₹{selectedBookingForCancel.meal?.rebateAmount || 45} Rebate Credit
                                    </strong>
                                    <p>
                                        This credit will be immediately added to your dining wallet balance.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() => setSelectedBookingForCancel(null)}
                            >
                                Keep My Reservation
                            </button>
                            <button
                                className="danger-button"
                                onClick={confirmCancelBooking}
                                disabled={cancelId === selectedBookingForCancel._id}
                            >
                                {cancelId === selectedBookingForCancel._id
                                    ? "Processing..."
                                    : "Confirm Cancellation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default MyBookings;
