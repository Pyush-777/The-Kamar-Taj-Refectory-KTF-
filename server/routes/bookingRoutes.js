
const express = require("express");

const {
    createBooking,
    getMyBookings,
    cancelBooking,
    verifyBooking,
    getAllBookings
} = require("../controllers/bookingController");

const {
    protect,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==================== STUDENT ROUTES ====================

// Create a booking for a meal
router.post(
    "/",
    protect,
    authorizeRoles("student"),
    createBooking
);

// Get bookings of the logged-in student
router.get(
    "/my",
    protect,
    authorizeRoles("student"),
    getMyBookings
);

// Cancel a booking
router.patch(
    "/:bookingId/cancel",
    protect,
    authorizeRoles("student"),
    cancelBooking
);

// ==================== ADMIN ROUTES ====================

// Get all bookings
router.get(
    "/",
    protect,
    authorizeRoles("admin"),
    getAllBookings
);

// Verify a booking using its QR booking code
router.patch(
    "/verify",
    protect,
    authorizeRoles("admin"),
    verifyBooking
);

module.exports = router;
