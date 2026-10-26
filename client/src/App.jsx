import { useState, useEffect } from "react";
import {
    Utensils,
    LogOut,
    LayoutDashboard,
    ClipboardList,
    Menu,
    X,
    Ticket,
    Receipt,
    BarChart3,
    Scale,
    Shield,
    Clock,
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

    // Update the live clock every second.
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Synchronize the logged-in user's profile with the backend.
    useEffect(() => {
        if (!user) return;

        let isMounted = true;

        api.get("/auth/me")
            .then((res) => {
                if (isMounted && res.data.user) {
                    setUser(res.data.user);
                    localStorage.setItem(
                        "user",
                        JSON.stringify(res.data.user)
                    );
                }
            })
            .catch((err) => {
                console.warn("Profile sync error:", err.message);
            });

        return () => {
            isMounted = false;
        };
    }, [page]); // Refresh the profile when the page changes.

    // Handle successful login.
    function handleLogin(loggedInUser) {
        setUser(loggedInUser);
        setPage(
            loggedInUser.role === "admin" ? "admin-bookings" : "meals"
        );
        setMobileMenuOpen(false);
    }

    // Clear the local login session.
    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setPage("meals");
        setAuthPage("login");
        setMobileMenuOpen(false);
    }

    // Navigate to a page and close the mobile sidebar.
    function navigate(nextPage) {
        setPage(nextPage);
        setMobileMenuOpen(false);
    }

    // Close the mobile sidebar when the Escape key is pressed.
    useEffect(() => {
        function handleEscape(event) {
            if (event.key === "Escape") {
                setMobileMenuOpen(false);
            }
        }

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // Authentication screens.
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
            {/* Top navigation bar */}
            <header className="topbar">
                <button
                    type="button"
                    className="brand"
                    onClick={() => navigate("meals")}
                    aria-label="Go to meal menu"
                >
                    <span className="brand-icon">
                        <Utensils size={22} />
                    </span>

                    <span className="brand-text">
                        <strong>The Kamar-Taj Refectory</strong>
                        <small>
                            Smart College Mess Management • Team OPM
                        </small>
                    </span>
                </button>

                <div className="topbar-center">
                    <div className="live-clock">
                        <Clock size={15} />
                        <span>
                            {currentTime.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </span>
                    </div>
                </div>

                <div className="topbar-right">
                    {/* In-app notifications */}
                    <NotificationCenter />

                    {/* Logged-in user information */}
                    <div className="user-area">
                        <div
                            className={`user-avatar ${
                                isAdmin ? "admin" : "student"
                            }`}
                        >
                            {isAdmin ? (
                                <Shield size={16} />
                            ) : (
                                (user.name || "U")
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>

                        <div className="user-details">
                            <strong>{user.name || "User"}</strong>
                            <span className="role-tag">
                                {isAdmin
                                    ? "Mess Admin"
                                    : `Student • ${user.studentId || "ID"}`}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="icon-button logout-button"
                            onClick={handleLogout}
                            title="Log out"
                            aria-label="Log out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        type="button"
                        className="mobile-menu-button"
                        onClick={() =>
                            setMobileMenuOpen((open) => !open)
                        }
                        aria-label={
                            mobileMenuOpen
                                ? "Close navigation menu"
                                : "Open navigation menu"
                        }
                        aria-expanded={mobileMenuOpen}
                        aria-controls="app-sidebar"
                    >
                        {mobileMenuOpen ? (
                            <X size={22} />
                        ) : (
                            <Menu size={22} />
                        )}
                    </button>
                </div>
            </header>

            {/* Main application layout */}
            <div className="main-layout">
                {/* Mobile backdrop; clicking it closes the sidebar */}
                {mobileMenuOpen && (
                    <button
                        type="button"
                        className="sidebar-backdrop"
                        aria-label="Close navigation menu"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar navigation */}
                <aside
                    id="app-sidebar"
                    className={`sidebar ${
                        mobileMenuOpen ? "sidebar-open" : ""
                    }`}
                    aria-label="Main navigation"
                >
                    <p className="sidebar-label">DINING PORTAL</p>

                    <button
                        type="button"
                        className={`nav-item ${
                            page === "meals" ? "active" : ""
                        }`}
                        onClick={() => navigate("meals")}
                    >
                        <LayoutDashboard size={19} />
                        Meal Menu
                    </button>

                    {!isAdmin && (
                        <>
                            <button
                                type="button"
                                className={`nav-item ${
                                    page === "bookings" ? "active" : ""
                                }`}
                                onClick={() => navigate("bookings")}
                            >
                                <Ticket size={19} />
                                My QR Passes
                            </button>

                            <button
                                type="button"
                                className={`nav-item ${
                                    page === "billing" ? "active" : ""
                                }`}
                                onClick={() => navigate("billing")}
                            >
                                <Receipt size={19} />
                                Mess Bill &amp; Rebates
                            </button>
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <p className="sidebar-label sidebar-label-spaced">
                                ENTRANCE &amp; VERIFICATION
                            </p>

                            <button
                                type="button"
                                className={`nav-item ${
                                    page === "admin-bookings" ? "active" : ""
                                }`}
                                onClick={() => navigate("admin-bookings")}
                            >
                                <ClipboardList size={19} />
                                QR Scanner &amp; Bookings
                            </button>

                            <p className="sidebar-label sidebar-label-spaced">
                                REFECTORY OPERATIONS
                            </p>

                            <button
                                type="button"
                                className={`nav-item ${
                                    page === "admin-meals" ? "active" : ""
                                }`}
                                onClick={() => navigate("admin-meals")}
                            >
                                <Utensils size={19} />
                                Manage Meals
                            </button>

                            <button
                                type="button"
                                className={`nav-item ${
                                    page === "admin-reports" ? "active" : ""
                                }`}
                                onClick={() => navigate("admin-reports")}
                            >
                                <BarChart3 size={19} />
                                Analytics &amp; Reports
                            </button>

                            <button
                                type="button"
                                className={`nav-item ${
                                    page === "admin-waste" ? "active" : ""
                                }`}
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

                {/* Current page content */}
                <main className="content">
                    {page === "meals" && <MealMenu user={user} />}

                    {page === "bookings" && !isAdmin && <MyBookings />}

                    {page === "billing" && !isAdmin && <StudentBilling />}

                    {page === "admin-bookings" && isAdmin && (
                        <AdminBookings />
                    )}

                    {page === "admin-meals" && isAdmin && (
                        <AdminDashboard />
                    )}

                    {page === "admin-reports" && isAdmin && (
                        <AdminReports />
                    )}

                    {page === "admin-waste" && isAdmin && <AdminWaste />}
                </main>
            </div>
        </div>
    );
}

export default App;