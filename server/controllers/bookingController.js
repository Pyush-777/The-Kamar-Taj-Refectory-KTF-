const crypto = require("crypto");
const QRCode = require("qrcode");
const mongoose = require("mongoose");

const Meal = require("../models/Meal");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { sendNotification } = require("../services/notificationService");

// ==========================================
// 1. Create a meal booking with a QR code
// ==========================================
const createBooking = async (req, res) => {
    try {
        const { mealId } = req.body;
        const studentId = req.user.userId;

        // Validate the meal ID
        if (!mongoose.isValidObjectId(mealId)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid meal ID."
            });
        }

        // Find the meal
        const meal = await Meal.findById(mealId);

        if (!meal) {
            return res.status(404).json({
                success: false,
                message: "Meal schedule not found."
            });
        }

        const now = new Date();

        // Check whether booking is allowed
        if (
            !meal.isBookingOpen ||
            meal.bookingDeadline <= now ||
            meal.date <= now
        ) {
            return res.status(400).json({
                success: false,
                message: "Bookings are closed for this meal."
            });
        }

        // Check if student already booked this meal
        const existingBooking = await Booking.findOne({
            student: studentId,
            meal: mealId
        });

        if (existingBooking) {
            if (existingBooking.status === "booked") {
                return res.status(409).json({
                    success: false,
                    message: "You have already reserved this meal."
                });
            } else if (existingBooking.status === "cancelled") {
                // If previously cancelled, remove previous to re-book
                await Booking.findByIdAndDelete(existingBooking._id);
            } else {
                return res.status(409).json({
                    success: false,
                    message: "You already have a completed reservation for this meal."
                });
            }
        }

        // Reserve one place atomically only if capacity remains
        const updatedMeal = await Meal.findOneAndUpdate(
            {
                _id: mealId,
                isBookingOpen: true,
                bookingDeadline: { $gt: now },
                date: { $gt: now },
                $expr: {
                    $lt: ["$bookedCount", "$capacity"]
                }
            },
            {
                $inc: { bookedCount: 1 }
            },
            {
                new: true
            }
        );

        if (!updatedMeal) {
            return res.status(409).json({
                success: false,
                message: "No places are available for this meal (Capacity full)."
            });
        }

        try {
            // Generate a secure, unpredictable 48-char booking code
            const bookingCode = crypto.randomBytes(24).toString("hex");

            // Generate the QR image
            const qrCode = await QRCode.toDataURL(bookingCode, {
                errorCorrectionLevel: "H",
                margin: 2,
                color: {
                    dark: "#0b132b",
                    light: "#ffffff"
                }
            });

            // Save the booking with the generated QR code string
            const booking = await Booking.create({
                student: studentId,
                meal: mealId,
                bookingCode,
                qrCode,
                status: "booked"
            });

            // Fetch student info for notification
            const studentUser = await User.findById(studentId);

            // Send notification & email
            await sendNotification({
                userId: studentId,
                toEmail: studentUser?.email,
                userName: studentUser?.name || "Student",
                subject: `Meal Booking Confirmed: ${meal.mealType.toUpperCase()}`,
                title: `Meal Reserved: ${meal.mealType.toUpperCase()}`,
                message: `Your reservation for ${meal.mealType} on ${new Date(meal.date).toLocaleDateString()} has been confirmed. Please present your QR code at the refectory entrance during the meal window.`,
                type: "booking",
                metadata: {
                    bookingId: booking._id,
                    bookingCode,
                    mealType: meal.mealType,
                    mealDate: meal.date
                }
            });

            return res.status(201).json({
                success: true,
                message: "Meal booked successfully.",
                booking,
                qrCode
            });
        } catch (error) {
            // Roll back bookedCount if error occurs
            await Meal.updateOne(
                {
                    _id: mealId,
                    bookedCount: { $gt: 0 }
                },
                {
                    $inc: { bookedCount: -1 }
                }
            );

            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "You have already booked this meal."
                });
            }

            throw error;
        }
    } catch (error) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to book this meal."
        });
    }
};

// ==========================================
// 2. View the logged-in student's bookings
// ==========================================
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            student: req.user.userId
        })
            .populate(
                "meal",
                "mealType date menu bookingDeadline capacity price rebateAmount serviceWindow"
            )
            .sort({ createdAt: -1 });

        // Ensure every booking has a valid QR code dataURL
        const enrichedBookings = await Promise.all(
            bookings.map(async (b) => {
                const bookingObj = b.toObject();
                if (!bookingObj.qrCode && bookingObj.bookingCode) {
                    try {
                        bookingObj.qrCode = await QRCode.toDataURL(bookingObj.bookingCode, {
                            errorCorrectionLevel: "H",
                            margin: 2
                        });
                    } catch (e) {
                        console.error("Error generating qr on the fly:", e);
                    }
                }
                return bookingObj;
            })
        );

        return res.status(200).json({
            success: true,
            count: enrichedBookings.length,
            bookings: enrichedBookings
        });
    } catch (error) {
        console.error("Get bookings error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your bookings."
        });
    }
};

// ==========================================
// 3. Cancel a booking & calculate rebate
// ==========================================
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Validate the booking ID
        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID."
            });
        }

        // Find a booking belonging to this student
        const booking = await Booking.findOne({
            _id: bookingId,
            student: req.user.userId
        }).populate("meal");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        // Only active bookings can be cancelled
        if (booking.status !== "booked") {
            return res.status(400).json({
                success: false,
                message: `This booking is already ${booking.status} and cannot be cancelled.`
            });
        }

        const meal = booking.meal;

        if (!meal) {
            return res.status(404).json({
                success: false,
                message: "Associated meal schedule not found."
            });
        }

        // Check the cancellation deadline
        if (new Date() >= meal.bookingDeadline) {
            return res.status(400).json({
                success: false,
                message: "The cancellation deadline for this meal has passed."
            });
        }

        const rebateCredit = meal.rebateAmount || 45;

        // Atomically cancel only if the booking is still active
        const cancelledBooking = await Booking.findOneAndUpdate(
            {
                _id: bookingId,
                student: req.user.userId,
                status: "booked"
            },
            {
                $set: {
                    status: "cancelled",
                    cancelledAt: new Date(),
                    rebateCredited: rebateCredit
                }
            },
            {
                new: true
            }
        );

        if (!cancelledBooking) {
            return res.status(409).json({
                success: false,
                message: "This booking has already been updated."
            });
        }

        // Release one reserved place in the meal schedule
        await Meal.updateOne(
            {
                _id: meal._id,
                bookedCount: { $gt: 0 }
            },
            {
                $inc: { bookedCount: -1 }
            }
        );

        // Credit student rebate wallet
        const studentUser = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $inc: {
                    balance: rebateCredit,
                    totalRebates: rebateCredit
                }
            },
            { new: true }
        );

        // Send notification & email
        await sendNotification({
            userId: req.user.userId,
            toEmail: studentUser?.email,
            userName: studentUser?.name || "Student",
            subject: `Meal Cancelled & Rebate Credited: ₹${rebateCredit}`,
            title: "Meal Booking Cancelled",
            message: `Your booking for ${meal.mealType} on ${new Date(meal.date).toLocaleDateString()} was cancelled before the cutoff. An eligible mess rebate of ₹${rebateCredit} has been credited to your dining balance.`,
            type: "rebate",
            metadata: {
                bookingId: booking._id,
                mealType: meal.mealType,
                rebateCredited: rebateCredit,
                newBalance: studentUser?.balance
            }
        });

        return res.status(200).json({
            success: true,
            message: `Booking cancelled successfully. Rebate of ₹${rebateCredit} credited to your account.`,
            rebateCredited: rebateCredit,
            newBalance: studentUser?.balance
        });
    } catch (error) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel booking."
        });
    }
};

// ==========================================
// 4. Verify and redeem a booking using its QR
// Admin / Staff access only (enforced by route)
// ATOMIC & STRICT DUPLICATE PREVENTION
// ==========================================
const verifyBooking = async (req, res) => {
    try {
        const { bookingCode } = req.body;

        if (!bookingCode || typeof bookingCode !== "string") {
            return res.status(400).json({
                success: false,
                message: "Please scan or enter a booking code."
            });
        }

        const trimmedCode = bookingCode.trim();

        // Atomically redeem only an active booking
        const booking = await Booking.findOneAndUpdate(
            {
                bookingCode: trimmedCode,
                status: "booked"
            },
            {
                $set: {
                    status: "redeemed",
                    redeemedAt: new Date(),
                    verifiedBy: req.user.userId
                }
            },
            {
                new: true
            }
        )
            .populate("student", "name email studentId hostel roomNumber")
            .populate("meal", "mealType date menu serviceWindow");

        // If atomic update found nothing, determine exact diagnostic reason
        if (!booking) {
            const existingBooking = await Booking.findOne({
                bookingCode: trimmedCode
            })
                .populate("student", "name email studentId")
                .populate("meal", "mealType date");

            if (!existingBooking) {
                return res.status(404).json({
                    success: false,
                    reason: "NOT_FOUND",
                    message: "Invalid QR Code: No reservation found with this code."
                });
            }

            if (existingBooking.status === "redeemed") {
                const redeemedTime = existingBooking.redeemedAt
                    ? new Date(existingBooking.redeemedAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                      })
                    : "earlier today";

                return res.status(409).json({
                    success: false,
                    reason: "ALREADY_REDEEMED",
                    message: `DUPLICATE REDEMPTION BLOCKED: This booking was already redeemed at ${redeemedTime} by ${existingBooking.student?.name || "the student"}.`,
                    booking: existingBooking
                });
            }

            if (existingBooking.status === "cancelled") {
                return res.status(400).json({
                    success: false,
                    reason: "CANCELLED",
                    message: `CANNOT REDEEM: This reservation was cancelled by ${existingBooking.student?.name || "the student"}.`,
                    booking: existingBooking
                });
            }

            return res.status(400).json({
                success: false,
                reason: "EXPIRED",
                message: `This booking is in '${existingBooking.status}' state and cannot be redeemed.`
            });
        }

        // Notify student of successful check-in
        if (booking.student?._id) {
            await sendNotification({
                userId: booking.student._id,
                toEmail: booking.student.email,
                userName: booking.student.name,
                subject: `Check-in Verified: ${booking.meal?.mealType?.toUpperCase()}`,
                title: "Refectory Meal Check-in Successful",
                message: `Your meal check-in for ${booking.meal?.mealType} has been verified at the refectory entrance at ${new Date().toLocaleTimeString("en-IN")}. Enjoy your meal!`,
                type: "checkin",
                metadata: {
                    bookingId: booking._id,
                    mealType: booking.meal?.mealType,
                    redeemedAt: booking.redeemedAt
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Meal Check-In Verified Successfully!",
            booking
        });
    } catch (error) {
        console.error("Verify booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify booking."
        });
    }
};

// ==========================================
// 5. Admin: Get all bookings with filtering & search
// ==========================================
const getAllBookings = async (req, res) => {
    try {
        const { status, mealType, date, search } = req.query;

        let query = {};

        if (status && status !== "all") {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate("student", "name email studentId hostel roomNumber")
            .populate("meal", "mealType date menu serviceWindow capacity")
            .populate("verifiedBy", "name email")
            .sort({ createdAt: -1 });

        // In-memory filter for mealType and search if needed
        let filtered = bookings;

        if (mealType && mealType !== "all") {
            filtered = filtered.filter(
                (b) => b.meal && b.meal.mealType === mealType
            );
        }

        if (date) {
            const searchDateStr = new Date(date).toDateString();
            filtered = filtered.filter(
                (b) => b.meal && new Date(b.meal.date).toDateString() === searchDateStr
            );
        }

        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter((b) => {
                const sName = b.student?.name?.toLowerCase() || "";
                const sEmail = b.student?.email?.toLowerCase() || "";
                const sId = b.student?.studentId?.toLowerCase() || "";
                const bCode = b.bookingCode?.toLowerCase() || "";
                return sName.includes(s) || sEmail.includes(s) || sId.includes(s) || bCode.includes(s);
            });
        }

        return res.status(200).json({
            success: true,
            count: filtered.length,
            bookings: filtered
        });
    } catch (error) {
        console.error("Get all bookings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings."
        });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    cancelBooking,
    verifyBooking,
    getAllBookings
};
