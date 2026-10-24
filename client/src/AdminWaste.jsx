import { useEffect, useState } from "react";
import {
    Scale,
    Trash2,
    Plus,
    Calendar,
    AlertCircle,
    TrendingDown,
    Leaf,
    RefreshCw,
    IndianRupee
} from "lucide-react";
import api from "./api";

function AdminWaste() {
    const [wasteData, setWasteData] = useState(null);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [showLogModal, setShowLogModal] = useState(false);

    const [form, setForm] = useState({
        mealId: "",
        preparedPortions: "",
        consumedPortions: "",
        notes: ""
    });

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [wasteRes, mealsRes] = await Promise.all([
                api.get("/reports/waste"),
                api.get("/meals")
            ]);

            setWasteData(wasteRes.data);
            const mealsList = Array.isArray(mealsRes.data)
                ? mealsRes.data
                : mealsRes.data.meals || [];
            setMeals(mealsList);

            if (mealsList.length > 0 && !form.mealId) {
                setForm((prev) => ({ ...prev, mealId: mealsList[0]._id }));
            }
        } catch (err) {
            console.error("Waste report fetch error:", err);
            setError(err.response?.data?.message || "Failed to load food waste metrics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setSubmitting(true);

        try {
            const response = await api.post("/reports/waste/log", {
                mealId: form.mealId,
                preparedPortions: Number(form.preparedPortions),
                consumedPortions: Number(form.consumedPortions),
                notes: form.notes
            });

            setMessage(response.data.message || "Waste entry logged successfully.");
            setShowLogModal(false);
            setForm({
                mealId: meals[0]?._id || "",
                preparedPortions: "",
                consumedPortions: "",
                notes: ""
            });
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to record food waste entry.");
        } finally {
            setSubmitting(false);
        }
    };

    const summary = wasteData?.wasteSummary || {};
    const wasteLogs = wasteData?.wasteLogs || [];

    return (
        <section className="waste-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">SUSTAINABILITY & EFFICIENCY</p>
                    <h1>Food-Waste Intelligence</h1>
                    <p className="muted-text">
                        Analyze unredeemed meal surplus, track kitchen waste, and optimize dining preparation.
                    </p>
                </div>

                <div className="heading-actions">
                    <button
                        className="secondary-button"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        className="primary-button"
                        onClick={() => setShowLogModal(true)}
                    >
                        <Plus size={18} />
                        Log Kitchen Waste
                    </button>
                </div>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="empty-state">
                    <div className="spinner" />
                    <p>Evaluating kitchen waste telemetry...</p>
                </div>
            ) : (
                <>
                    {/* Waste Metric Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-wrapper amber">
                                <Scale size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Unredeemed Meal Portions</span>
                                <h3 className="stat-value">{summary.totalUnredeemedPortions || 0}</h3>
                                <span className="stat-sub">Booked meals without attendance</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper red">
                                <Trash2 size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Estimated Waste Weight</span>
                                <h3 className="stat-value">{summary.estimatedWasteKg || 0} kg</h3>
                                <span className="stat-sub">~0.35 kg standard portion weight</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper violet">
                                <IndianRupee size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Estimated Economic Loss</span>
                                <h3 className="stat-value">₹{summary.estimatedEconomicWaste || 0}</h3>
                                <span className="stat-sub">Cost of unserved ingredients</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper emerald">
                                <Leaf size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Logged Leftover Waste</span>
                                <h3 className="stat-value">{summary.totalLoggedWasteKg || 0} kg</h3>
                                <span className="stat-sub">Kitchen audit records</span>
                            </div>
                        </div>
                    </div>

                    {/* Sustainability Tip Banner */}
                    <div className="eco-banner">
                        <Leaf size={24} className="eco-icon" />
                        <div>
                            <h4>Dynamic Waste Reduction Impact</h4>
                            <p>
                                By mandating reservations before booking deadlines, The Kamar-Taj Refectory
                                prevents kitchen overcooking by up to 28% compared to unmetered dining lines.
                            </p>
                        </div>
                    </div>

                    {/* Logged Waste Table */}
                    <div className="table-card">
                        <div className="table-toolbar">
                            <div className="section-heading compact-heading">
                                <Scale size={20} />
                                <h2>Kitchen Food Waste Audit Log</h2>
                                <span className="count-pill">{wasteLogs.length}</span>
                            </div>
                        </div>

                        {wasteLogs.length === 0 ? (
                            <div className="empty-state">
                                <Scale size={32} />
                                <h3>No kitchen waste entries logged yet</h3>
                                <p>Click "Log Kitchen Waste" to record surplus or leftover dining food.</p>
                            </div>
                        ) : (
                            <div className="table-scroll">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date & Meal</th>
                                            <th>Prepared</th>
                                            <th>Consumed</th>
                                            <th>Wasted Portions</th>
                                            <th>Waste (Kg)</th>
                                            <th>Est. Loss (₹)</th>
                                            <th>Logged By</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wasteLogs.map((log) => (
                                            <tr key={log._id}>
                                                <td>
                                                    <strong>
                                                        {log.mealType.charAt(0).toUpperCase() +
                                                            log.mealType.slice(1)}
                                                    </strong>
                                                    <small className="table-subtext">
                                                        {new Date(log.date).toLocaleDateString()}
                                                    </small>
                                                </td>
                                                <td>{log.preparedPortions}</td>
                                                <td>{log.consumedPortions}</td>
                                                <td>
                                                    <span className="status-pill cancelled">
                                                        {log.wastedPortions}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>{log.estimatedWasteKg} kg</strong>
                                                </td>
                                                <td>₹{log.estimatedWasteCost}</td>
                                                <td>{log.loggedBy?.name || "Mess Staff"}</td>
                                                <td>
                                                    <small>{log.notes || "Standard kitchen run"}</small>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Log Modal */}
                    {showLogModal && (
                        <div className="modal-backdrop">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Record Kitchen Food Waste</h3>
                                    <button
                                        className="icon-button"
                                        onClick={() => setShowLogModal(false)}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleFormSubmit} className="modal-form">
                                    <div className="form-field">
                                        <label htmlFor="log-meal">Associated Meal Offering</label>
                                        <select
                                            id="log-meal"
                                            value={form.mealId}
                                            onChange={(e) =>
                                                setForm({ ...form, mealId: e.target.value })
                                            }
                                            required
                                        >
                                            {meals.map((m) => (
                                                <option key={m._id} value={m._id}>
                                                    {m.mealType.toUpperCase()} -{" "}
                                                    {new Date(m.date).toLocaleDateString()} (Booked:{" "}
                                                    {m.bookedCount}/{m.capacity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-field-row">
                                        <div className="form-field">
                                            <label htmlFor="prepared-qty">Portions Cooked</label>
                                            <input
                                                id="prepared-qty"
                                                type="number"
                                                min="1"
                                                value={form.preparedPortions}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        preparedPortions: e.target.value
                                                    })
                                                }
                                                placeholder="e.g. 150"
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="consumed-qty">Portions Served</label>
                                            <input
                                                id="consumed-qty"
                                                type="number"
                                                min="0"
                                                value={form.consumedPortions}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        consumedPortions: e.target.value
                                                    })
                                                }
                                                placeholder="e.g. 138"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="log-notes">Kitchen Observations</label>
                                        <textarea
                                            id="log-notes"
                                            rows="3"
                                            value={form.notes}
                                            onChange={(e) =>
                                                setForm({ ...form, notes: e.target.value })
                                            }
                                            placeholder="e.g. Leftover rice composted, sambar excess batch"
                                        />
                                    </div>

                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => setShowLogModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="primary-button"
                                            disabled={submitting}
                                        >
                                            {submitting ? "Saving..." : "Save Entry"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

export default AdminWaste;
