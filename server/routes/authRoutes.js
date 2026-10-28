const express = require("express");

const {
    getAllowedDomains,
    sendOtp,
    verifyOtp,
    registerUser,
    loginUser,
    getMe
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const {
    createIpRateLimiter,
    emailOtpRateLimiter
} = require("../middleware/rateLimiter");

const router = express.Router();

// IP rate limiters for abuse prevention
const sendOtpIpLimiter = createIpRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: "Too many verification requests from this network. Please try again after 15 minutes."
});

const verifyOtpIpLimiter = createIpRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Too many verification attempts from this network. Please try again after 15 minutes."
});

const registerIpLimiter = createIpRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many registration attempts from this network. Please try again later."
});

// Retrieve allowed college email domains
router.get("/domains", getAllowedDomains);

// Request a 6-digit OTP to a valid college email
router.post("/send-otp", sendOtpIpLimiter, emailOtpRateLimiter, sendOtp);

// Verify the 6-digit OTP and receive a verification proof token
router.post("/verify-otp", verifyOtpIpLimiter, verifyOtp);

// Register a new student (requires valid verification proof)
router.post("/register", registerIpLimiter, registerUser);

// Login user
router.post("/login", loginUser);

// Get current profile
router.get("/me", protect, getMe);

module.exports = router;
