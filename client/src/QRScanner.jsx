import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import confetti from "canvas-confetti";
import {
    Camera,
    Upload,
    Keyboard,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    UserCheck,
    Clock,
    Utensils,
    ShieldAlert
} from "lucide-react";
import api from "./api";
import { playSuccessBeep, playErrorBeep } from "./utils/sound";

function QRScanner({ onScanSuccess }) {
    const [scanMode, setScanMode] = useState("camera"); // "camera", "file", "manual"
    const [bookingCodeInput, setBookingCodeInput] = useState("");
    const [cameraActive, setCameraActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);
    const [cameraError, setCameraError] = useState("");
    const [recentCheckIns, setRecentCheckIns] = useState([]);

    const scannerRef = useRef(null);

    // Stop camera on unmount or mode switch
    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.warn("Error stopping scanner:", err);
            }
            scannerRef.current = null;
        }
        setCameraActive(false);
    };

    // Verify code on server — declared before startCamera so the camera callback can reference it
    const handleCodeVerification = async (code) => {
        if (!code || loading) return;

        // Clean code if URL or raw hex
        let cleanCode = code.trim();
        if (cleanCode.includes("/")) {
            cleanCode = cleanCode.split("/").pop();
        }

        setLoading(true);
        setCameraError("");

        try {
            const response = await api.patch("/bookings/verify", {
                bookingCode: cleanCode
            });

            const data = response.data;
            playSuccessBeep();
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 }
            });

            const successResult = {
                status: "success",
                message: data.message || "Check-In Verified!",
                booking: data.booking,
                timestamp: new Date()
            };

            setLastScanResult(successResult);
            setRecentCheckIns((prev) => [successResult, ...prev.slice(0, 7)]);
            setBookingCodeInput("");

            if (onScanSuccess) onScanSuccess(data.booking);
        } catch (err) {
            playErrorBeep();
            const errData = err.response?.data || {};
            const reason = errData.reason || "ERROR";

            const errorResult = {
                status: reason === "ALREADY_REDEEMED" ? "duplicate" : "error",
                message: errData.message || "Check-In Failed: Unable to verify booking.",
                booking: errData.booking || null,
                timestamp: new Date()
            };

            setLastScanResult(errorResult);
        } finally {
            setLoading(false);
        }
    };

    // Start HTML5 Camera
    const startCamera = async () => {
        setCameraError("");
        await stopCamera();

        try {
            const scanner = new Html5Qrcode("qr-reader-container");
            scannerRef.current = scanner;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            };

            await scanner.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    handleCodeVerification(decodedText);
                },
                () => {
                    // Ignore transient scanning frames
                }
            );

            setCameraActive(true);
        } catch (err) {
            console.error("Camera start failed:", err);
            setCameraError(
                err.name === "NotAllowedError"
                    ? "Camera permission denied. Please allow camera access in browser settings or use image upload / manual code."
                    : "Unable to access camera hardware. Try file upload or manual code entry."
            );
            setCameraActive(false);
        }
    };

    useEffect(() => {
        if (scanMode === "camera") {
            startCamera(); // eslint-disable-line react-hooks/set-state-in-effect
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [scanMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle File QR upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCameraError("");
        setLoading(true);

        try {
            const html5QrCode = new Html5Qrcode("qr-file-processor");
            const decodedText = await html5QrCode.scanFile(file, true);
            html5QrCode.clear();
            await handleCodeVerification(decodedText);
        } catch (err) {
            console.error("File QR scan error:", err);
            setCameraError("Could not read a valid QR code from this image. Please ensure the code is clear and well-lit.");
            playErrorBeep();
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!bookingCodeInput.trim()) return;
        handleCodeVerification(bookingCodeInput.trim());
    };

    return (
        <div className="scanner-layout">
            <div className="scanner-control-card">
                <div className="scanner-tabs">
                    <button
                        className={`scanner-tab ${scanMode === "camera" ? "active" : ""}`}
                        onClick={() => setScanMode("camera")}
                    >
                        <Camera size={18} />
                        Live Camera
                    </button>

                    <button
                        className={`scanner-tab ${scanMode === "file" ? "active" : ""}`}
                        onClick={() => setScanMode("file")}
                    >
                        <Upload size={18} />
                        Upload QR Image
                    </button>

                    <button
                        className={`scanner-tab ${scanMode === "manual" ? "active" : ""}`}
                        onClick={() => setScanMode("manual")}
                    >
                        <Keyboard size={18} />
                        Manual Code Entry
                    </button>
                </div>

                {/* Camera Mode */}
                {scanMode === "camera" && (
                    <div className="scanner-camera-box">
                        <div id="qr-reader-container" className="camera-viewport" />
                        {!cameraActive && !cameraError && (
                            <div className="camera-placeholder">
                                <div className="spinner" />
                                <p>Starting entrance webcam scanner...</p>
                            </div>
                        )}
                        {cameraError && (
                            <div className="alert alert-error">
                                <AlertTriangle size={18} />
                                <span>{cameraError}</span>
                            </div>
                        )}
                        <p className="scanner-hint">
                            Position the student's booking QR code within the frame to verify automatically.
                        </p>
                    </div>
                )}

                {/* File Upload Mode */}
                {scanMode === "file" && (
                    <div className="scanner-file-box">
                        <div id="qr-file-processor" style={{ display: "none" }} />
                        <label className="file-drop-zone">
                            <Upload size={36} />
                            <p className="drop-title">Select or Drop a QR Code Image</p>
                            <p className="drop-subtitle">Accepts PNG, JPG, or Screenshots</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={loading}
                            />
                        </label>
                    </div>
                )}

                {/* Manual Code Mode */}
                {scanMode === "manual" && (
                    <form onSubmit={handleManualSubmit} className="manual-code-form">
                        <label htmlFor="manual-booking-code">Enter Booking Code</label>
                        <div className="input-group">
                            <input
                                id="manual-booking-code"
                                type="text"
                                placeholder="Paste 48-character booking hex code"
                                value={bookingCodeInput}
                                onChange={(e) => setBookingCodeInput(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={loading || !bookingCodeInput.trim()}
                            >
                                {loading ? "Verifying..." : "Verify Entry"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Verification Result Showcase Banner */}
            {lastScanResult && (
                <div
                    className={`verification-banner ${
                        lastScanResult.status === "success"
                            ? "verified"
                            : lastScanResult.status === "duplicate"
                            ? "duplicate"
                            : "rejected"
                    }`}
                >
                    <div className="banner-icon-col">
                        {lastScanResult.status === "success" && <CheckCircle2 size={38} />}
                        {lastScanResult.status === "duplicate" && <ShieldAlert size={38} />}
                        {lastScanResult.status === "error" && <XCircle size={38} />}
                    </div>

                    <div className="banner-content-col">
                        <div className="banner-header">
                            <h3>
                                {lastScanResult.status === "success"
                                    ? "MEAL CHECK-IN APPROVED"
                                    : lastScanResult.status === "duplicate"
                                    ? "DUPLICATE REDEMPTION BLOCKED"
                                    : "VERIFICATION REJECTED"}
                            </h3>
                            <span className="banner-time">
                                <Clock size={14} />
                                {new Date(lastScanResult.timestamp).toLocaleTimeString()}
                            </span>
                        </div>

                        <p className="banner-message">{lastScanResult.message}</p>

                        {lastScanResult.booking && (
                            <div className="banner-details-grid">
                                <div>
                                    <span className="detail-label">Student Name:</span>
                                    <strong>{lastScanResult.booking.student?.name || "Student"}</strong>
                                </div>
                                <div>
                                    <span className="detail-label">Roll / ID:</span>
                                    <strong>{lastScanResult.booking.student?.studentId || "N/A"}</strong>
                                </div>
                                <div>
                                    <span className="detail-label">Hostel & Room:</span>
                                    <span>
                                        {lastScanResult.booking.student?.hostel || "Main Wing"} - {lastScanResult.booking.student?.roomNumber || "204"}
                                    </span>
                                </div>
                                <div>
                                    <span className="detail-label">Meal Type:</span>
                                    <strong className="badge-highlight">
                                        {lastScanResult.booking.meal?.mealType?.toUpperCase() || "MEAL"}
                                    </strong>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Live Entrance Check-In Stream */}
            {recentCheckIns.length > 0 && (
                <div className="recent-checkins-card">
                    <div className="section-heading compact-heading">
                        <UserCheck size={20} />
                        <h2>Recent Entrance Check-Ins</h2>
                        <span className="count-pill">{recentCheckIns.length}</span>
                    </div>

                    <div className="checkin-stream">
                        {recentCheckIns.map((item, idx) => (
                            <div key={idx} className="stream-row">
                                <div className="stream-badge success">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div className="stream-student">
                                    <strong>{item.booking?.student?.name}</strong>
                                    <small>{item.booking?.student?.studentId}</small>
                                </div>
                                <div className="stream-meal">
                                    <Utensils size={14} />
                                    <span>{item.booking?.meal?.mealType?.toUpperCase()}</span>
                                </div>
                                <div className="stream-time">
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default QRScanner;
