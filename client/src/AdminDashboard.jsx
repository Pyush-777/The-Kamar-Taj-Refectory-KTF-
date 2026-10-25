import { useState, useEffect } from "react";
import {
    Plus,
    Utensils,
    CalendarDays,
    Users,
    Clock,
    IndianRupee,
    Trash2,
    ToggleLeft,
    ToggleRight,
    RefreshCw,
    Sparkles
} from "lucide-react";
import api from "./api";

const PRESET_TEMPLATES = [
    {
        name: "South Indian Breakfast",
        mealType: "breakfast",
        menu: "Masala Dosa, Idli-Vada, Coconut Chutney, Sambar, Filter Coffee",
        capacity: 180,
        price: 45,
        rebateAmount: 35,
        serviceStart: "07:30",
        serviceEnd: "09:45"
    },
    {
        name: "North Indian Lunch Thali",
        mealType: "lunch",
        menu: "Paneer Butter Masala, Dal Tadka, Jeera Rice, Tandoori Roti, Boondi Raita, Gulab Jamun",
        capacity: 220,
        price: 85,
        rebateAmount: 65,
        serviceStart: "12:30",
        serviceEnd: "14:30"
    },
    {
        name: "Evening Chai & Snacks",
        mealType: "snacks",
        menu: "Crispy Samosa with Mint Chutney, Onion Pakoras, Masala Chai",
        capacity: 150,
        price: 35,
        rebateAmount: 25,
        serviceStart: "17:00",
        serviceEnd: "18:30"
    },
    {
        name: "Deluxe Feast Dinner",
        mealType: "dinner",
        menu: "Kadai Paneer / Chicken Biryani, Butter Naan, Mixed Veg Curry, Gulab Jamun, Ice Cream",
        capacity: 200,
        price: 90,
        rebateAmount: 70,
        serviceStart: "19:45",
        serviceEnd: "21:45"
    }
];

function AdminDashboard() {
    const [form, setForm] = useState({
        mealType: "breakfast",
        date: "",
        bookingDeadline: "",
        serviceStart: "08:00",
        serviceEnd: "10:00",
        menu: "",
        capacity: 150,
        price: 60,
        rebateAmount: 45
    });

    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mealsLoading, setMealsLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const fetchMeals = async () => {
        setMealsLoading(true);
        try {
            const res = await api.get("/meals");
            const data = res.data;
            setMeals(Array.isArray(data) ? data : data.meals || []);
        } catch (err) {
            console.error("Meals load error:", err);
        } finally {
            setMealsLoading(false);
        }
    };

    useEffect(() => {
        fetchMeals(); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    function applyTemplate(tpl) {
        // Pre-fill tomorrow at designated hour
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const hoursMap = {
            breakfast: 8,
            lunch: 13,
            snacks: 17,
            dinner: 20
        };

        const targetHour = hoursMap[tpl.mealType] || 12;
        tomorrow.setHours(targetHour, 0, 0, 0);

        const deadlineDate = new Date(tomorrow);
        deadlineDate.setHours(targetHour - 2, 0, 0, 0);

        // Format to ISO string for datetime-local (YYYY-MM-DDTHH:MM)
        const formatLocal = (d) => {
            const pad = (n) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setForm({
            mealType: tpl.mealType,
            date: formatLocal(tomorrow),
            bookingDeadline: formatLocal(deadlineDate),
            serviceStart: tpl.serviceStart,
            serviceEnd: tpl.serviceEnd,
            menu: tpl.menu,
            capacity: tpl.capacity,
            price: tpl.price,
            rebateAmount: tpl.rebateAmount
        });

        setMessage(`Template "${tpl.name}" applied to the form.`);
    }

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        const menuItems = form.menu
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        if (menuItems.length === 0) {
            setError("Please enter at least one menu dish.");
            return;
        }

        if (new Date(form.bookingDeadline) >= new Date(form.date)) {
            setError("The booking deadline cutoff must be strictly before the meal date.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/meals", {
                mealType: form.mealType,
                date: new Date(form.date).toISOString(),
                bookingDeadline: new Date(form.bookingDeadline).toISOString(),
                serviceWindow: {
                    start: form.serviceStart,
                    end: form.serviceEnd
                },
                menu: menuItems,
                capacity: Number(form.capacity),
                price: Number(form.price),
                rebateAmount: Number(form.rebateAmount)
            });

            setMessage("Meal offering scheduled and published successfully.");
            setForm({
                mealType: "breakfast",
                date: "",
                bookingDeadline: "",
                serviceStart: "08:00",
                serviceEnd: "10:00",
                menu: "",
                capacity: 150,
                price: 60,
                rebateAmount: 45
            });

            await fetchMeals();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not publish the meal. Ensure schedule doesn't conflict."
            );
        } finally {
            setLoading(false);
        }
    }

    async function toggleMeal(mealId) {
        try {
            const res = await api.patch(`/meals/${mealId}/toggle-status`);
            setMessage(res.data.message);
            await fetchMeals();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update meal status.");
        }
    }

    async function deleteMeal(mealId) {
        const confirmed = window.confirm("Are you sure you want to delete this scheduled meal?");
        if (!confirmed) return;

        try {
            const res = await api.delete(`/meals/${mealId}`);
            setMessage(res.data.message);
            await fetchMeals();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete meal.");
        }
    }

    return (
        <section className="manage-meals-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">ADMINISTRATIVE CONTROL PANEL</p>
                    <h1>Manage Dining Schedules & Offerings</h1>
                    <p className="muted-text">
                        Configure meal times, service windows, capacity thresholds, dishes, and booking cutoffs.
                    </p>
                </div>

                <div className="heading-actions">
                    <button
                        className="secondary-button"
                        onClick={fetchMeals}
                        disabled={mealsLoading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            {/* Quick Template Strip */}
            <div className="templates-card">
                <div className="template-header">
                    <Sparkles size={18} className="text-violet" />
                    <strong>Quick Schedule Templates (1-Click Fill)</strong>
                </div>
                <div className="template-chips">
                    {PRESET_TEMPLATES.map((tpl, i) => (
                        <button
                            key={i}
                            type="button"
                            className="template-chip"
                            onClick={() => applyTemplate(tpl)}
                        >
                            + {tpl.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Meal Creator Card */}
            <div className="admin-form-card">
                <div className="section-heading">
                    <div className="section-heading-icon">
                        <Utensils size={21} />
                    </div>
                    <div>
                        <h2>Publish New Meal Schedule</h2>
                        <p className="muted-text">
                            Specify dining parameters, booking deadlines, and capacity rules.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-field">
                        <label htmlFor="mealType">Meal Category</label>
                        <select
                            id="mealType"
                            name="mealType"
                            value={form.mealType}
                            onChange={handleChange}
                            required
                        >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="snacks">Snacks</option>
                            <option value="dinner">Dinner</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="date">
                            <CalendarDays size={15} /> Meal Date & Time
                        </label>
                        <input
                            id="date"
                            type="datetime-local"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="bookingDeadline">
                            <Clock size={15} /> Booking Cutoff Deadline
                        </label>
                        <input
                            id="bookingDeadline"
                            type="datetime-local"
                            name="bookingDeadline"
                            value={form.bookingDeadline}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="capacity">
                            <Users size={15} /> Maximum Seat Capacity
                        </label>
                        <input
                            id="capacity"
                            type="number"
                            name="capacity"
                            min="1"
                            value={form.capacity}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="serviceStart">
                            <Clock size={15} /> Service Window Start
                        </label>
                        <input
                            id="serviceStart"
                            type="time"
                            name="serviceStart"
                            value={form.serviceStart}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="serviceEnd">
                            <Clock size={15} /> Service Window End
                        </label>
                        <input
                            id="serviceEnd"
                            type="time"
                            name="serviceEnd"
                            value={form.serviceEnd}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="price">
                            <IndianRupee size={15} /> Meal Price (INR)
                        </label>
                        <input
                            id="price"
                            type="number"
                            name="price"
                            min="0"
                            value={form.price}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="rebateAmount">
                            <IndianRupee size={15} /> Cancellation Rebate (INR)
                        </label>
                        <input
                            id="rebateAmount"
                            type="number"
                            name="rebateAmount"
                            min="0"
                            value={form.rebateAmount}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field form-field-wide">
                        <label htmlFor="menu">Menu Dishes (Comma-Separated)</label>
                        <textarea
                            id="menu"
                            name="menu"
                            rows="3"
                            placeholder="Paneer Tikka, Jeera Rice, Tandoori Roti, Dal Tadka, Salad"
                            value={form.menu}
                            onChange={handleChange}
                            required
                        />
                        <small>Separate individual dishes with commas.</small>
                    </div>

                    <div className="form-field-wide">
                        <button
                            className="primary-button"
                            type="submit"
                            disabled={loading}
                        >
                            <Plus size={18} />
                            {loading ? "Publishing Schedule..." : "Publish Meal Schedule"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Scheduled Meals Overview Table */}
            <div className="table-card">
                <div className="table-toolbar">
                    <div className="section-heading compact-heading">
                        <Utensils size={20} />
                        <h2>Active Refectory Meal Schedules</h2>
                        <span className="count-pill">{meals.length}</span>
                    </div>
                </div>

                {mealsLoading ? (
                    <div className="empty-state">
                        <div className="spinner" />
                        <p>Loading meal schedules...</p>
                    </div>
                ) : meals.length === 0 ? (
                    <div className="empty-state">
                        <Utensils size={32} />
                        <h3>No meals scheduled yet</h3>
                        <p>Use the form above or pick a template to publish a meal.</p>
                    </div>
                ) : (
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Meal Type</th>
                                    <th>Date</th>
                                    <th>Service Window</th>
                                    <th>Capacity & Booked</th>
                                    <th>Cutoff Deadline</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meals.map((meal) => {
                                    const booked = meal.bookedCount || 0;
                                    const cap = meal.capacity || 100;

                                    return (
                                        <tr key={meal._id}>
                                            <td>
                                                <strong>
                                                    {meal.mealType.toUpperCase()}
                                                </strong>
                                                <small className="table-subtext">
                                                    ₹{meal.price || 60} • Rebate ₹{meal.rebateAmount || 45}
                                                </small>
                                            </td>

                                            <td>
                                                {new Date(meal.date).toLocaleDateString("en-IN", {
                                                    weekday: "short",
                                                    day: "numeric",
                                                    month: "short"
                                                })}
                                            </td>

                                            <td>
                                                {meal.serviceWindow?.start || "08:00"} -{" "}
                                                {meal.serviceWindow?.end || "10:00"}
                                            </td>

                                            <td>
                                                <div className="mini-capacity">
                                                    <span>
                                                        {booked} / {cap}
                                                    </span>
                                                    <div className="mini-track">
                                                        <div
                                                            className="mini-fill"
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    (booked / cap) * 100
                                                                )}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <small>
                                                    {new Date(meal.bookingDeadline).toLocaleDateString()}{" "}
                                                    {new Date(meal.bookingDeadline).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </small>
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-pill ${
                                                        meal.isBookingOpen ? "booked" : "cancelled"
                                                    }`}
                                                >
                                                    {meal.isBookingOpen ? "Open" : "Closed"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="action-buttons-row">
                                                    <button
                                                        className="icon-button"
                                                        onClick={() => toggleMeal(meal._id)}
                                                        title={
                                                            meal.isBookingOpen
                                                                ? "Close bookings"
                                                                : "Open bookings"
                                                        }
                                                    >
                                                        {meal.isBookingOpen ? (
                                                            <ToggleRight size={19} className="text-emerald" />
                                                        ) : (
                                                            <ToggleLeft size={19} className="text-muted" />
                                                        )}
                                                    </button>

                                                    <button
                                                        className="icon-button danger"
                                                        onClick={() => deleteMeal(meal._id)}
                                                        title="Delete schedule"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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

export default AdminDashboard;
