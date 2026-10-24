import { useEffect, useState } from "react";
import {
    Search,
    RefreshCw,
    CheckCircle,
    ClipboardList,
    Camera,
    Download,
    Filter,
    Clock,
    Utensils,
    CalendarDays
} from "lucide-react";
import api from "./api";
import QRScanner from "./QRScanner";

function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [mealTypeFilter, setMealTypeFilter] = useState("all");
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function fetchBookings() {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/bookings");
            const data = response.data;
            setBookings(Array.isArray(data) ? data : data.bookings || []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Could not load reservations from server."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter((booking) => {
        const student = booking.student || {};
        const meal = booking.meal || {};

        if (statusFilter !== "all" && booking.status !== statusFilter) {
            return false;
        }

        if (mealTypeFilter !== "all" && meal.mealType !== mealTypeFilter) {
            return false;
        }

        const searchableText = [
            booking.bookingCode,
            booking.status,
            student.name,
            student.email,
            student.studentId,
            student.hostel,
            meal.mealType
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchableText.includes(search.toLowerCase());
    });

    function formatDate(date) {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });
    }

    function formatTime(date) {
        if (!date) return "";
        return new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // Export reservations to CSV file
    const exportToCSV = () => {
        if (filteredBookings.length === 0) return;

        const headers = ["Student Name", "Student ID", "Email", "Meal Type", "Meal Date", "Booking Code", "Status", "Redeemed At"];
        const rows = filteredBookings.map((b) => [
            b.student?.name || "Unknown",
            b.student?.studentId || "N/A",
            b.student?.email || "N/A",
            b.meal?.mealType?.toUpperCase() || "MEAL",
            b.meal?.date ? new Date(b.meal.date).toLocaleDateString() : "",
            b.bookingCode || "",
            b.status || "booked",
            b.redeemedAt ? new Date(b.redeemedAt).toLocaleString() : ""
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `refectory_reservations_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="admin-bookings-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">REFECTORY VERIFICATION DESK</p>
                    <h1>Entrance QR Verification & Reservations</h1>
                    <p className="muted-text">
                        Scan incoming student QR codes at the mess entrance and inspect reservation audit trails.
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

                    <button
                        className="secondary-button"
                        onClick={exportToCSV}
                        disabled={filteredBookings.length === 0}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>

                    <button
                        className={`primary-button ${showScanner ? "scanner-active-btn" : ""}`}
                        onClick={() => setShowScanner(!showScanner)}
                    >
                        <Camera size={18} />
                        {showScanner ? "Close Entrance Scanner" : "Launch QR Scanner"}
                    </button>
                </div>
            </div>

            {/* Entrance Scanner Drawer / Container */}
            {showScanner && (
                <div className="scanner-entrance-wrapper">
                    <div className="scanner-header-bar">
                        <div className="scanner-title">
                            <Camera size={20} className="text-emerald" />
                            <strong>Turnstile Camera Check-In Scanner</strong>
                        </div>
                        <button
                            className="text-button"
                            onClick={() => setShowScanner(false)}
                        >
                            ✕ Close
                        </button>
                    </div>

                    <QRScanner onScanSuccess={fetchBookings} />
                </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            {/* Filter and Search Bar */}
            <div className="table-card">
                <div className="table-toolbar">
                    <div className="toolbar-left">
                        <div className="section-heading compact-heading">
                            <ClipboardList size={20} />
                            <h2>Student Reservation Records</h2>
                            <span className="count-pill">{filteredBookings.length}</span>
                        </div>
                    </div>

                    <div className="toolbar-filters">
                        <div className="filter-item">
                            <select
                                value={mealTypeFilter}
                                onChange={(e) => setMealTypeFilter(e.target.value)}
                            >
                                <option value="all">All Meals</option>
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="snacks">Snacks</option>
                                <option value="dinner">Dinner</option>
                            </select>
                        </div>

                        <div className="filter-item">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="booked">Booked (Pending)</option>
                                <option value="redeemed">Redeemed (Checked In)</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="search-input">
                            <Search size={17} />
                            <input
                                placeholder="Search student name, ID, or code..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="spinner" />
                        <p>Loading refectory reservations...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="empty-state">
                        <ClipboardList size={32} />
                        <h3>No reservations matched</h3>
                        <p>Try adjusting your filters or search keywords.</p>
                    </div>
                ) : (
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Meal Type</th>
                                    <th>Scheduled Date</th>
                                    <th>Booking Code</th>
                                    <th>Status & Audit</th>
                                    <th>Check-in Timestamp</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredBookings.map((booking) => {
                                    const student = booking.student || {};
                                    const meal = booking.meal || {};
                                    const status = booking.status || "booked";

                                    return (
                                        <tr key={booking._id}>
                                            <td>
                                                <strong>{student.name || "Unknown"}</strong>
                                                <small className="table-subtext">
                                                    Roll: {student.studentId || "N/A"} •{" "}
                                                    {student.hostel || "Hall A"}
                                                </small>
                                            </td>

                                            <td>
                                                <strong>
                                                    {meal.mealType
                                                        ? meal.mealType.toUpperCase()
                                                        : "MEAL"}
                                                </strong>
                                                {meal.serviceWindow && (
                                                    <small className="table-subtext">
                                                        {meal.serviceWindow.start} -{" "}
                                                        {meal.serviceWindow.end}
                                                    </small>
                                                )}
                                            </td>

                                            <td>{formatDate(meal.date)}</td>

                                            <td>
                                                <code title={booking.bookingCode}>
                                                    {booking.bookingCode
                                                        ? `${booking.bookingCode.slice(0, 14)}...`
                                                        : "—"}
                                                </code>
                                            </td>

                                            <td>
                                                <span className={`status-pill ${status}`}>
                                                    {status === "redeemed" && (
                                                        <CheckCircle size={13} />
                                                    )}
                                                    {status}
                                                </span>
                                            </td>

                                            <td>
                                                {booking.redeemedAt ? (
                                                    <span className="text-emerald">
                                                        {formatDate(booking.redeemedAt)}{" "}
                                                        {formatTime(booking.redeemedAt)}
                                                    </span>
                                                ) : booking.status === "cancelled" ? (
                                                    <span className="text-muted">
                                                        Cancelled (Rebate ₹{booking.rebateCredited || 45})
                                                    </span>
                                                ) : (
                                                    <span className="text-amber">Pending Entry</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminBookings;
