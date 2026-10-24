
import { useState } from "react";

const API_URL = "http://localhost:5000";

function Booking() {
    const [mealId, setMealId] = useState("");
    const [booking, setBooking] = useState(null);
    const [qrCode, setQrCode] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Book a meal using the backend API
    const handleBooking = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");
        setBooking(null);
        setQrCode("");

        try {
            // Get the student's login token
            const token = localStorage.getItem("token");

            if (!token) {
                setMessage("Please log in before booking a meal.");
                return;
            }

            // Send the meal ID to the backend
            const response = await fetch(`${API_URL}/api/bookings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ mealId })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Booking failed.");
                return;
            }

            // Save booking details and QR image
            setBooking(data.booking);
            setQrCode(data.qrCode);
            setMessage("Meal booked successfully!");
        } catch (error) {
            console.error("Booking error:", error);
            setMessage("Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">
                Book a Meal
            </h1>

            <form onSubmit={handleBooking} className="space-y-4">
                <label className="block">
                    Meal ID
                    <input
                        type="text"
                        value={mealId}
                        onChange={(e) => setMealId(e.target.value)}
                        placeholder="Paste a meal ID"
                        required
                        className="block w-full border rounded p-2 mt-1"
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-violet-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {loading ? "Booking..." : "Book Meal"}
                </button>
            </form>

            {message && (
                <p className="mt-4" role="status">
                    {message}
                </p>
            )}

            {booking && (
                <div className="mt-6 border rounded-lg p-4">
                    <h2 className="text-xl font-semibold">
                        Booking Confirmed
                    </h2>

                    <p className="mt-2">
                        Booking ID: {booking._id}
                    </p>

                    <p>
                        Status: {booking.status}
                    </p>

                    {qrCode && (
                        <div className="mt-4">
                            <p className="mb-2">
                                Show this QR code at the mess:
                            </p>

                            <img
                                src={qrCode}
                                alt="Meal booking QR code"
                                className="w-56 h-56"
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = qrCode;
                                    link.download = "meal-booking-qr.png";
                                    link.click();
                                }}
                                className="mt-3 block bg-gray-800 text-white px-4 py-2 rounded"
                            >
                                Download QR Code
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Booking;
