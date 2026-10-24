import { useState } from "react";
import { Utensils, Mail, Lock, ArrowRight, Shield, UserCheck, Sparkles } from "lucide-react";
import api from "./api";

function Login({ onLogin, onSwitch }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLoginSubmit(targetEmail, targetPassword) {
        setError("");
        setLoading(true);

        const emailToSend = targetEmail || email;
        const passToSend = targetPassword || password;

        try {
            const response = await api.post("/auth/login", {
                email: emailToSend,
                password: passToSend
            });

            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error("Server authentication failed.");
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            onLogin(user);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Invalid login credentials. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    const quickLoginStudent = () => {
        setEmail("student@kamartaj.edu");
        setPassword("Student@12345");
        handleLoginSubmit("student@kamartaj.edu", "Student@12345");
    };

    const quickLoginAdmin = () => {
        setEmail("admin@kamartaj.edu");
        setPassword("Admin@12345");
        handleLoginSubmit("admin@kamartaj.edu", "Admin@12345");
    };

    return (
        <div className="auth-card">
            <div className="auth-logo">
                <Utensils size={30} />
            </div>

            <p className="eyebrow">THE KAMAR-TAJ REFECTORY</p>
            <h1>Campus Dining Access</h1>
            <p className="muted-text">
                Sign in to manage meal reservations, QR passes, and dining ledger.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleLoginSubmit();
                }}
                className="form-stack"
            >
                <label className="field-label" htmlFor="login-email">
                    Campus Email Address
                </label>
                <div className="input-with-icon">
                    <Mail size={18} />
                    <input
                        id="login-email"
                        type="email"
                        placeholder="student@kamartaj.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <label className="field-label" htmlFor="login-password">
                    Password
                </label>
                <div className="input-with-icon">
                    <Lock size={18} />
                    <input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    className="primary-button full-width"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Sign in to Refectory"}
                    {!loading && <ArrowRight size={18} />}
                </button>
            </form>

            {/* Quick Demo Credentials for Fast Evaluation */}
            <div className="demo-login-box">
                <div className="demo-title">
                    <Sparkles size={15} />
                    <span>Instant Demo Accounts</span>
                </div>
                <div className="demo-buttons-grid">
                    <button
                        type="button"
                        className="demo-btn student"
                        onClick={quickLoginStudent}
                        disabled={loading}
                    >
                        <UserCheck size={16} />
                        <div>
                            <strong>Student Access</strong>
                            <small>Mradul Kumar (20253161)</small>
                        </div>
                    </button>

                    <button
                        type="button"
                        className="demo-btn admin"
                        onClick={quickLoginAdmin}
                        disabled={loading}
                    >
                        <Shield size={16} />
                        <div>
                            <strong>Mess Admin</strong>
                            <small>Ancient One (Full Control)</small>
                        </div>
                    </button>
                </div>
            </div>

            <p className="auth-switch">
                New student at the refectory?{" "}
                <button type="button" onClick={onSwitch}>
                    Register account
                </button>
            </p>
        </div>
    );
}

export default Login;
