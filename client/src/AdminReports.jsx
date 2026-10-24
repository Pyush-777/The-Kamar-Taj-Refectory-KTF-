import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from "recharts";
import {
    TrendingUp,
    Users,
    CheckCircle,
    XCircle,
    Percent,
    IndianRupee,
    RefreshCw,
    Calendar,
    FileSpreadsheet
} from "lucide-react";
import api from "./api";

const PIE_COLORS = ["#10b981", "#6366f1", "#f43f5e"];

function AdminReports() {
    const [overview, setOverview] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReportData = async () => {
        setLoading(true);
        setError("");

        try {
            const [overviewRes, attendanceRes] = await Promise.all([
                api.get("/reports/overview"),
                api.get("/reports/attendance")
            ]);

            setOverview(overviewRes.data.summary);
            setAttendanceData(attendanceRes.data);
        } catch (err) {
            console.error("Fetch report error:", err);
            setError(err.response?.data?.message || "Failed to load reports and analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    const pieData = overview
        ? [
              { name: "Redeemed", value: overview.redeemedBookings },
              { name: "Active", value: overview.activeBookings },
              { name: "Cancelled", value: overview.cancelledBookings }
          ].filter((d) => d.value > 0)
        : [];

    return (
        <section className="reports-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">RECORDS & INSIGHTS</p>
                    <h1>Refectory Analytics & Reports</h1>
                    <p className="muted-text">
                        Evaluate dining trends, capacity utilization, and attendance conversion rates.
                    </p>
                </div>

                <div className="heading-actions">
                    <button
                        className="secondary-button"
                        onClick={fetchReportData}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh Data
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="empty-state">
                    <div className="spinner" />
                    <p>Aggregating refectory consumption metrics...</p>
                </div>
            ) : (
                <>
                    {/* Top KPI Metric Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-wrapper indigo">
                                <Users size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Total Reservations</span>
                                <h3 className="stat-value">{overview?.totalBookings || 0}</h3>
                                <span className="stat-sub">Across all meal schedules</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper emerald">
                                <CheckCircle size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Meals Redeemed</span>
                                <h3 className="stat-value">{overview?.redeemedBookings || 0}</h3>
                                <span className="stat-sub">Entrance QR check-ins</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper violet">
                                <Percent size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Check-in Conversion</span>
                                <h3 className="stat-value">{overview?.redemptionRate || 0}%</h3>
                                <span className="stat-sub">Redeemed vs Total Booked</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper amber">
                                <IndianRupee size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Total Rebates Credited</span>
                                <h3 className="stat-value">₹{overview?.totalRebatesGiven || 0}</h3>
                                <span className="stat-sub">Cancelled before cutoff</span>
                            </div>
                        </div>
                    </div>

                    {/* Today's Live Attendance Strip */}
                    {overview?.today && (
                        <div className="today-strip">
                            <div className="strip-header">
                                <Calendar size={18} />
                                <strong>Today's Live Mess Status</strong>
                            </div>
                            <div className="strip-metrics">
                                <div className="strip-item">
                                    <span>Scheduled Meals:</span>
                                    <strong>{overview.today.mealsCount}</strong>
                                </div>
                                <div className="strip-item">
                                    <span>Today's Bookings:</span>
                                    <strong>{overview.today.bookings}</strong>
                                </div>
                                <div className="strip-item highlight-green">
                                    <span>Already Checked-In:</span>
                                    <strong>{overview.today.redeemed}</strong>
                                </div>
                                <div className="strip-item highlight-blue">
                                    <span>Pending Arrival:</span>
                                    <strong>{overview.today.pending}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual Charts Grid */}
                    <div className="charts-grid">
                        {/* Attendance by Meal Type */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Attendance by Meal Type</h3>
                                <span className="chart-tag">Booked vs Redeemed</span>
                            </div>

                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={290}>
                                    <BarChart
                                        data={attendanceData?.mealTypeStats || []}
                                        margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                                    >
                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#0f172a",
                                                borderColor: "#334155",
                                                borderRadius: "8px",
                                                color: "#f8fafc"
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="totalBooked" name="Total Booked" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="redeemed" name="Redeemed (Attended)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="cancelled" name="Cancelled" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status Breakdown Donut */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Reservation Status Distribution</h3>
                                <span className="chart-tag">Overall Breakdown</span>
                            </div>

                            <div className="chart-container donut-box">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={290}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={95}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#0f172a",
                                                    borderColor: "#334155",
                                                    borderRadius: "8px",
                                                    color: "#f8fafc"
                                                }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="muted-text center">No status distribution data yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

export default AdminReports;
