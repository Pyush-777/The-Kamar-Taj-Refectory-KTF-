import { useState } from "react";
import { Utensils, User, Mail, Lock, IdCard, Home, Building } from "lucide-react";
import api from "./api";

function Register({ onSwitch, onRegistered }) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        studentId: "",
        hostel: "Kamar-Taj Hall A",
        roomNumber: "302"
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleChange(event) {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await api.post("/auth/register", form);

            setSuccess("Student account created successfully! Switching to sign in...");
            setForm({
                name: "",
                email: "",
                password: "",
                studentId: "",
                hostel: "Kamar-Taj Hall A",
                roomNumber: "302"
            });

            setTimeout(() => onRegistered(), 900);
        } catch (err) {
            setError(
                err.response?.data?.message || "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-card">
            <div className="auth-logo">
                <Utensils size={30} />
            </div>

            <p className="eyebrow">STUDENT ONBOARDING</p>
            <h1>Create Dining Account</h1>
            <p className="muted-text">
                Register to reserve daily mess meals, receive entry QR codes, and claim rebates.
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} className="form-stack">
                <label className="field-label" htmlFor="register-name">
                    Full Name
                </label>
                <div className="input-with-icon">
                    <User size={18} />
                    <input
                        id="register-name"
                        name="name"
                        placeholder="e.g. Om Narayan Dubey"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <label className="field-label" htmlFor="register-email">
                    Campus Email Address
                </label>
                <div className="input-with-icon">
                    <Mail size={18} />
                    <input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="student@kamartaj.edu"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-field-row">
                    <div>
                        <label className="field-label" htmlFor="register-student-id">
                            Roll / Student ID
                        </label>
                        <div className="input-with-icon">
                            <IdCard size={18} />
                            <input
                                id="register-student-id"
                                name="studentId"
                                placeholder="20253178"
                                value={form.studentId}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="field-label" htmlFor="register-hostel">
                            Hostel Hall
                        </label>
                        <div className="input-with-icon">
                            <Building size={18} />
                            <input
                                id="register-hostel"
                                name="hostel"
                                placeholder="Kamar-Taj Hall A"
                                value={form.hostel}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <label className="field-label" htmlFor="register-password">
                    Password (Min. 8 characters)
                </label>
                <div className="input-with-icon">
                    <Lock size={18} />
                    <input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />
                </div>

                <button
                    className="primary-button full-width"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Creating Account..." : "Create Student Account"}
                </button>
            </form>

            <p className="auth-switch">
                Already registered?{" "}
                <button type="button" onClick={onSwitch}>
                    Sign in
                </button>
            </p>
        </div>
    );
}

export default Register;
