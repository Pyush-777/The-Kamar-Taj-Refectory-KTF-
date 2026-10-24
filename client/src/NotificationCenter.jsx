import { useState, useEffect, useRef } from "react";
import {
    Bell,
    Check,
    CheckCheck,
    CalendarCheck,
    XCircle,
    UserCheck,
    IndianRupee,
    Info
} from "lucide-react";
import api from "./api";

const notificationIcons = {
    booking: CalendarCheck,
    checkin: UserCheck,
    cancellation: XCircle,
    rebate: IndianRupee,
    system: Info
};

function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications/my");
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.warn("Could not fetch notifications:", err.message);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for live updates
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Mark all read error:", err);
        }
    };

    return (
        <div className="notification-center" ref={dropdownRef}>
            <button
                className="icon-button notification-trigger"
                onClick={() => setOpen(!open)}
                title="Notifications"
                aria-label="View notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <div className="notification-title-col">
                            <h4>Refectory Alerts</h4>
                            <small>{unreadCount} unread</small>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                className="text-button"
                                onClick={markAllAsRead}
                            >
                                <CheckCheck size={14} />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={24} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const Icon = notificationIcons[n.type] || Info;

                                return (
                                    <div
                                        key={n._id}
                                        className={`notification-item ${
                                            n.read ? "read" : "unread"
                                        }`}
                                        onClick={() => !n.read && markAsRead(n._id)}
                                    >
                                        <div className={`notification-icon ${n.type}`}>
                                            <Icon size={16} />
                                        </div>

                                        <div className="notification-body">
                                            <strong>{n.title}</strong>
                                            <p>{n.message}</p>
                                            <span className="notification-time">
                                                {new Date(n.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}{" "}
                                                • {new Date(n.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {!n.read && <span className="unread-dot" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationCenter;
