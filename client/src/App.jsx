import { useState, useEffect } from "react";
import {
    Utensils,
    LogOut,
    LayoutDashboard,
    CalendarCheck,
    ClipboardList,
    Menu,
    X,
    Ticket,
    Receipt,
    BarChart3,
    Scale,
    Shield,
    UserCheck,
    Clock
} from "lucide-react";

import Login from "./Login";
import Register from "./Register";
import MealMenu from "./MealMenu";
import MyBookings from "./MyBookings";
import StudentBilling from "./StudentBilling";
import AdminDashboard from "./AdminDashboard";
import AdminBookings from "./AdminBookings";
import AdminReports from "./AdminReports";
import AdminWaste from "./AdminWaste";
import NotificationCenter from "./NotificationCenter";
import api from "./api";

function App() {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user")) || null;
        } catch {
            return null;
        }
    });

    const [page, setPage] = useState("meals");
    const [authPage, setAuthPage] = useState("login");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live clock update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Refresh user profile
    useEffect(() => {
        if (user) {
            api.get("/auth/me")
                .then((res) => {
                    if (res.data.user) {
                        setUser(res.data.user);
                        localStorage.setItem("user", JSON.stringify(res.data.user));
                    }
                })
                .catch((err) => {
                    console.warn("Profile sync error:", err.message);
                });
        }
    }, [page]);

    function handleLogin(loggedInUser) {
        setUser(loggedInUser);
        setPage(loggedInUser.role === "admin" ? "admin-bookings" : "meals");
    }

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setPage("meals");
        setAuthPage("login");
    }

    function navigate(nextPage) {
        setPage(nextPage);
        setMobileMenuOpen(false);
    }

    if (!user) {
        return (
            <div className="auth-page">
                {authPage === "login" ? (
                    <Login
                        onLogin={handleLogin}
                        onSwitch={() => setAuthPage("register")}
                    />
                ) : (
                    <Register
                        onSwitch={() => setAuthPage("login")}
                        onRegistered={() => setAuthPage("login")}
                    />
                )}
            </div>
        );
    }

    const isAdmin = user.role === "admin";

    return (
        <div className="app-shell">
            {/* Top Navigation Bar */}
            <header className="topbar">
                <button
                    className="brand"
                    onClick={() => navigate("meals")}
                    aria-label="Go to meal menu"
                >
                    <span className="brand-icon">
                        <Utensils size={22} />
                    </span>

                    <span className="brand-text">
                        <strong>The Kamar-Taj Refectory</strong>
                        <small>Smart College Mess Management • Team OPM</small>
                    </span>
                </button>

                <div className="topbar-center">
                    <div className="live-clock">
                        <Clock size={15} />
                        <span>
                            {currentTime.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                            })}
                        </span>
                    </div>
                </div>

                <div className="topbar-right">
                    {/* In-App Notification Center */}
                    <NotificationCenter />

                    {/* User Profile Badge */}
                    <div className="user-area">
                        <div className={`user-avatar ${isAdmin ? "admin" : "student"}`}>
                            {isAdmin ? <Shield size={16} /> : (user.name || "U").charAt(0).toUpperCase()}
                        </div>

                        <div className="user-details">
                            <strong>{user.name || "User"}</strong>
                            <span className="role-tag">
                                {isAdmin ? "Mess Admin" : `Student • ${user.studentId || "ID"}`}
                            </span>
                        </div>

                        <button
                            className="icon-button logout-button"
                            onClick={handleLogout}
                            title="Log out"
                            aria-label="Log out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>

                    <button
                        className="mobile-menu-button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation"
                    >
                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </header>

            <div className="main-layout">
                {/* Sidebar Navigation */}
                <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
                    <p className="sidebar-label">DINING PORTAL</p>

                    <button
                        className={`nav-item ${page === "meals" ? "active" : ""}`}
                        onClick={() => navigate("meals")}
                    >
                        <LayoutDashboard size={19} />
                        Meal Menu
                    </button>

                    {!isAdmin && (
                        <>
                            <button
                                className={`nav-item ${page === "bookings" ? "active" : ""}`}
                                onClick={() => navigate("bookings")}
                            >
                                <Ticket size={19} />
                                My QR Passes
                            </button>

                            <button
                                className={`nav-item ${page === "billing" ? "active" : ""}`}
                                onClick={() => navigate("billing")}
                            >
                                <Receipt size={19} />
                                Mess Bill & Rebates
                            </button>
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <p className="sidebar-label sidebar-label-spaced">
                                ENTRANCE & VERIFICATION
                            </p>

                            <button
                                className={`nav-item ${
                                    page === "admin-bookings" ? "active" : ""
                                }`}
                                onClick={() => navigate("admin-bookings")}
                            >
                                <ClipboardList size={19} />
                                QR Scanner & Bookings
                            </button>

                            <p className="sidebar-label sidebar-label-spaced">
                                REFECTORY OPERATIONS
                            </p>

                            <button
                                className={`nav-item ${page === "admin-meals" ? "active" : ""}`}
                                onClick={() => navigate("admin-meals")}
                            >
                                <Utensils size={19} />
                                Manage Meals
                            </button>

                            <button
                                className={`nav-item ${
                                    page === "admin-reports" ? "active" : ""
                                }`}
                                onClick={() => navigate("admin-reports")}
                            >
                                <BarChart3 size={19} />
                                Analytics & Reports
                            </button>

                            <button
                                className={`nav-item ${page === "admin-waste" ? "active" : ""}`}
                                onClick={() => navigate("admin-waste")}
                            >
                                <Scale size={19} />
                                Food-Waste Tracking
                            </button>
                        </>
                    )}

                    <div className="sidebar-footer">
                        <span className="status-dot online" />
                        <span>Refectory Turnstile Online</span>
                    </div>
                </aside>

                {/* Page Content Viewport */}
                <main className="content">
                    {page === "meals" && <MealMenu user={user} />}

                    {page === "bookings" && !isAdmin && <MyBookings />}

                    {page === "billing" && !isAdmin && <StudentBilling />}

                    {page === "admin-bookings" && isAdmin && <AdminBookings />}

                    {page === "admin-meals" && isAdmin && <AdminDashboard />}

                    {page === "admin-reports" && isAdmin && <AdminReports />}

                    {page === "admin-waste" && isAdmin && <AdminWaste />}
                </main>
            </div>
        </div>
    );
}

export default App;
