
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        // Student who booked the meal
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Meal being booked
        meal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meal",
            required: true
        },

        // Unique identifier for the QR code
        bookingCode: {
            type: String,
            unique: true,
            required: true,
            sparse: true
        },

        // Stored QR code data URL for immediate rendering
        qrCode: {
            type: String,
            default: ""
        },

        // Track whether the student attended the meal
        status: {
            type: String,
            enum: ["booked", "cancelled", "redeemed", "expired"],
            default: "booked"
        },

        // When the meal QR was scanned and validated at entrance
        redeemedAt: {
            type: Date,
            default: null
        },

        // Administrator/Staff who scanned and confirmed entry
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Timestamp if cancelled by student
        cancelledAt: {
            type: Date,
            default: null
        },

        // Rebate credited to student account upon cancellation
        rebateCredited: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// One booking per student per meal
bookingSchema.index(
    { student: 1, meal: 1 },
    { unique: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;

