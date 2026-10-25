
import { useEffect, useState } from "react";
import {
    Coffee,
    Sun,
    Moon,
    Cookie,
    CalendarDays,
    Users,
    ArrowRight,
    RefreshCw,
    Clock,
    Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import api from "./api";

const mealIcons = {
    breakfast: Coffee,
    lunch: Sun,
    snacks: Cookie,
    dinner: Moon
};

function MealMenu({ user }) {
    const [meals, setMeals] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [bookingId, setBookingId] = useState("");
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    async function fetchMeals() {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/meals");
            const data = response.data;

            setMeals(Array.isArray(data) ? data : data.meals || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not load meal schedule. Check backend server."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMeals(); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    async function handleBooking(meal) {
        setBookingId(meal._id);
        setMessage("");
        setError("");

        try {
            const response = await api.post("/bookings", {
                mealId: meal._id
            });

            confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.6 }
            });

            setMessage(response.data.message || "Reservation confirmed!");

            setConfirmedBooking({
                booking: response.data.booking,
                qrCode: response.data.qrCode,
                meal
            });

            await fetchMeals();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Reservation failed. Please check capacity or booking deadline."
            );
        } finally {
            setBookingId("");
        }
    }

    function formatDate(date) {
        if (!date) return "Date not specified";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Invalid date";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function formatTime(date) {
        if (!date) return "";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }

        return parsedDate.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    const filteredMeals = meals.filter((meal) => {
        if (selectedCategory === "all") return true;
        return meal.mealType === selectedCategory;
    });

    const isStudent = user?.role !== "admin";

    return (
        <section className="meal-menu-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">REFECTORY OFFERINGS</p>
                    <h1>Daily Dining Schedule & Reservation</h1>
                    <p className="muted-text">
                        Browse upcoming meals, reserve before deadlines,
                        and receive instant entry QR passes.
                    </p>
                </div>

                <div className="heading-actions">
                    <button
                        className="secondary-button"
                        onClick={fetchMeals}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Meal Filter Strip */}
            <div className="tab-bar">
                {["all", "breakfast", "lunch", "snacks", "dinner"].map(
                    (category) => (
                        <button
                            key={category}
                            className={`tab-btn ${
                                selectedCategory === category ? "active" : ""
                            }`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category.charAt(0).toUpperCase() +
                                category.slice(1)}
                        </button>
                    )
                )}
            </div>

            {message && (
                <div className="alert alert-success">{message}</div>
            )}

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            {loading ? (
                <div className="empty-state">
                    <div className="spinner" />
                    <p>Loading refectory meal menu...</p>
                </div>
            ) : filteredMeals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Coffee size={32} />
                    </div>
                    <h3>No scheduled meals found</h3>
                    <p>
                        There are currently no meal offerings listed for
                        this filter. Check back shortly.
                    </p>
                </div>
            ) : (
                <div className="meal-grid">
                    {filteredMeals.map((meal) => {
                        const Icon = mealIcons[meal.mealType] || Coffee;

                        const capacity = Number(meal.capacity || 0);
                        const bookedCount = Number(meal.bookedCount || 0);

                        const remaining = Math.max(
                            0,
                            capacity - bookedCount
                        );

                        // Validate the booking deadline.
                        const deadline = meal.bookingDeadline
                            ? new Date(meal.bookingDeadline)
                            : null;

                        const hasValidDeadline =
                            deadline !== null &&
                            !Number.isNaN(deadline.getTime());

                        const deadlinePassed =
                            !hasValidDeadline ||
                            deadline.getTime() <= Date.now();

                        // Do not allow booking when closed, expired,
                        // or when the meal has reached its capacity.
                        const isClosed =
                            meal.isBookingOpen === false ||
                            deadlinePassed ||
                            remaining <= 0;

                        let buttonText = "Reserve Meal Pass";

                        if (bookingId === meal._id) {
                            buttonText = "Reserving...";
                        } else if (remaining <= 0) {
                            buttonText = "Capacity Full";
                        } else if (deadlinePassed) {
                            buttonText = "Booking Closed";
                        } else if (meal.isBookingOpen === false) {
                            buttonText = "Not Available";
                        }

                        return (
                            <article
                                className={`meal-card ${meal.mealType}`}
                                key={meal._id}
                            >
                                <div className={`meal-banner ${meal.mealType}`}>
                                    <div className="meal-icon-wrapper">
                                        <Icon size={26} />
                                    </div>

                                    <span className="meal-type-label">
                                        {meal.mealType.toUpperCase()}
                                    </span>
                                </div>

                                <div className="meal-body">
                                    <div className="meal-header-row">
                                        <div>
                                            <h2 className="meal-title">
                                                {meal.mealType
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    meal.mealType.slice(1)}
                                            </h2>

                                            <span className="date-badge">
                                                <CalendarDays size={14} />
                                                {formatDate(meal.date)}
                                            </span>
                                        </div>

                                        <div className="price-badge">
                                            <span>
                                                ₹{meal.price || 60}
                                            </span>
                                            <small>
                                                Rebate: ₹
                                                {meal.rebateAmount || 45}
                                            </small>
                                        </div>
                                    </div>

                                    {/* Service Window */}
                                    {meal.serviceWindow && (
                                        <div className="meal-window-badge">
                                            <Clock size={14} />
                                            <span>
                                                Service:{" "}
                                                {meal.serviceWindow.start} -{" "}
                                                {meal.serviceWindow.end}
                                            </span>
                                        </div>
                                    )}

                                    {/* Dishes List */}
                                    <div className="menu-tags-list">
                                        {(meal.menu || []).map(
                                            (dish, idx) => (
                                                <span
                                                    className="dish-pill"
                                                    key={idx}
                                                >
                                                    {dish}
                                                </span>
                                            )
                                        )}
                                    </div>

                                    {/* Capacity Progress */}
                                    <div className="capacity-container">
                                        <div className="capacity-label-row">
                                            <span>
                                                <Users size={14} />
                                                <strong>{remaining}</strong>{" "}
                                                seats remaining
                                            </span>

                                            <small>
                                                {bookedCount}/{capacity} booked
                                            </small>
                                        </div>

                                        <div className="capacity-track">
                                            <div
                                                className={`capacity-fill ${
                                                    remaining < 20
                                                        ? "low"
                                                        : "normal"
                                                }`}
                                                style={{
                                                    width:
                                                        capacity > 0
                                                            ? `${
                                                                  Math.min(
                                                                      100,
                                                                      (bookedCount /
                                                                          capacity) *
                                                                          100
                                                                  )
                                                              }%`
                                                            : "0%"
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Booking Deadline */}
                                    <div className="deadline-badge">
                                        <Clock size={13} />
                                        <span>
                                            Booking Cutoff:{" "}
                                            {formatDate(meal.bookingDeadline)}{" "}
                                            {formatTime(meal.bookingDeadline)}
                                        </span>
                                    </div>

                                    {/* Reserve Button */}
                                    {isStudent && (
                                        <button
                                            className="primary-button full-width reserve-btn"
                                            onClick={() => handleBooking(meal)}
                                            disabled={
                                                bookingId === meal._id ||
                                                isClosed
                                            }
                                        >
                                            {buttonText}

                                            {buttonText ===
                                                "Reserve Meal Pass" && (
                                                <ArrowRight size={17} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Booking Confirmation Pass Modal */}
            {confirmedBooking && (
                <div className="modal-backdrop">
                    <div className="modal-content confirmation-pass-modal">
                        <div className="modal-header">
                            <div className="modal-title-with-icon">
                                <Sparkles
                                    size={24}
                                    className="text-emerald"
                                />
                                <h3>Meal Reservation Confirmed!</h3>
                            </div>

                            <button
                                className="icon-button"
                                onClick={() => setConfirmedBooking(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body text-center">
                            <p className="pass-greeting">
                                Your pass for{" "}
                                <strong>
                                    {confirmedBooking.meal?.mealType?.toUpperCase()}
                                </strong>{" "}
                                on{" "}
                                {formatDate(confirmedBooking.meal?.date)} is
                                ready.
                            </p>

                            {confirmedBooking.qrCode && (
                                <div className="qr-popup-box">
                                    <img
                                        src={confirmedBooking.qrCode}
                                        alt="Meal Pass QR Code"
                                        className="qr-img-large"
                                    />

                                    <p className="qr-popup-hint">
                                        Show this QR code at the refectory
                                        entrance turnstile.
                                    </p>
                                </div>
                            )}

                            <div className="pass-meta-box">
                                <div>
                                    <small>Booking Code</small>
                                    <code>
                                        {confirmedBooking.booking?.bookingCode?.slice(
                                            0,
                                            20
                                        )}
                                        ...
                                    </code>
                                </div>

                                <div>
                                    <small>Eligible Cancellation Rebate</small>
                                    <strong className="text-emerald">
                                        ₹
                                        {confirmedBooking.meal?.rebateAmount ||
                                            45}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="primary-button full-width"
                                onClick={() => setConfirmedBooking(null)}
                            >
                                View in My Bookings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default MealMenu;
