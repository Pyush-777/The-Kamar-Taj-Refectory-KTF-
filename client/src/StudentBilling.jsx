import { useEffect, useState } from "react";
import {
    IndianRupee,
    Wallet,
    Receipt,
    CalendarCheck,
    CheckCircle,
    XCircle,
    RefreshCw,
    Download,
    ShieldCheck,
    User
} from "lucide-react";
import api from "./api";

function StudentBilling() {
    const [billingData, setBillingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchBilling = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/reports/billing");
            setBillingData(response.data.billing);
        } catch (err) {
            console.error("Fetch billing error:", err);
            setError(err.response?.data?.message || "Failed to load billing and rebate statement.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBilling();
    }, []);

    const printStatement = () => {
        window.print();
    };

    return (
        <section className="billing-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">FINANCIAL REBATE STATEMENT</p>
                    <h1>Mess Billing & Rebates</h1>
                    <p className="muted-text">
                        Review your monthly dining subscription, cancellation rebates, and wallet balance.
                    </p>
                </div>

                <div className="heading-actions">
                    <button
                        className="secondary-button"
                        onClick={fetchBilling}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button className="primary-button" onClick={printStatement}>
                        <Download size={16} />
                        Print Statement
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="empty-state">
                    <div className="spinner" />
                    <p>Computing billing and rebate credits...</p>
                </div>
            ) : billingData ? (
                <>
                    {/* Financial Summary Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-wrapper indigo">
                                <Receipt size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Monthly Mess Base Plan</span>
                                <h3 className="stat-value">₹{billingData.baseMonthlyPlan}</h3>
                                <span className="stat-sub">30-day fixed dining plan</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper emerald">
                                <IndianRupee size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Rebates Deducted</span>
                                <h3 className="stat-value text-emerald">
                                    -₹{billingData.totalRebatesEarned}
                                </h3>
                                <span className="stat-sub">Advance cancellation credits</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper violet">
                                <Wallet size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Net Balance Payable</span>
                                <h3 className="stat-value">₹{billingData.netPayable}</h3>
                                <span className="stat-sub">Final mess dues for cycle</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper amber">
                                <ShieldCheck size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Dining Wallet Balance</span>
                                <h3 className="stat-value">₹{billingData.balance}</h3>
                                <span className="stat-sub">Available campus credit</span>
                            </div>
                        </div>
                    </div>

                    {/* Student Identity Card */}
                    <div className="student-pass-card">
                        <div className="student-id-row">
                            <div className="student-avatar-big">
                                <User size={28} />
                            </div>
                            <div>
                                <h2>{billingData.studentName}</h2>
                                <p className="muted-text">
                                    Roll: <strong>{billingData.studentId}</strong> • Hostel:{" "}
                                    <strong>{billingData.hostel}</strong> (Room {billingData.roomNumber})
                                </p>
                            </div>
                        </div>

                        <div className="plan-badge">
                            <CalendarCheck size={16} />
                            <span>Active Mess Subscription (Fall 2026)</span>
                        </div>
                    </div>

                    {/* Rebates & Transactions History */}
                    <div className="table-card">
                        <div className="table-toolbar">
                            <div className="section-heading compact-heading">
                                <Receipt size={20} />
                                <h2>Itemized Meal Reservation & Rebate Ledger</h2>
                                <span className="count-pill">
                                    {billingData.history?.length || 0}
                                </span>
                            </div>
                        </div>

                        {!billingData.history || billingData.history.length === 0 ? (
                            <div className="empty-state">
                                <Receipt size={32} />
                                <h3>No ledger entries found</h3>
                                <p>Transactions and cancellation rebates will be documented here.</p>
                            </div>
                        ) : (
                            <div className="table-scroll">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Meal Offering</th>
                                            <th>Scheduled Date</th>
                                            <th>Status</th>
                                            <th>Standard Cost</th>
                                            <th>Rebate Earned</th>
                                            <th>Booking Code</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billingData.history.map((item) => (
                                            <tr key={item._id}>
                                                <td>
                                                    <strong>
                                                        {item.meal?.mealType
                                                            ? item.meal.mealType.toUpperCase()
                                                            : "MEAL"}
                                                    </strong>
                                                </td>
                                                <td>
                                                    {item.meal?.date
                                                        ? new Date(item.meal.date).toLocaleDateString(
                                                              "en-IN",
                                                              {
                                                                  day: "numeric",
                                                                  month: "short",
                                                                  year: "numeric"
                                                              }
                                                          )
                                                        : "—"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`status-pill ${
                                                            item.status || "booked"
                                                        }`}
                                                    >
                                                        {item.status || "booked"}
                                                    </span>
                                                </td>
                                                <td>₹{item.meal?.price || 60}</td>
                                                <td>
                                                    {item.status === "cancelled" ? (
                                                        <span className="rebate-credit">
                                                            +₹{item.rebateCredited || 45}
                                                        </span>
                                                    ) : (
                                                        <span className="muted-text">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <code>{item.bookingCode?.slice(0, 12)}...</code>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </section>
    );
}

export default StudentBilling;
