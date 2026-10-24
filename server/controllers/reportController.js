const Booking = require("../models/Booking");
const Meal = require("../models/Meal");
const User = require("../models/User");
const WasteLog = require("../models/WasteLog");

// ========================================================
// 1. Admin Executive Summary & Overview Metrics
// ========================================================
const getAdminOverview = async (req, res) => {
    try {
        const totalMeals = await Meal.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const redeemedBookings = await Booking.countDocuments({ status: "redeemed" });
        const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });
        const activeBookings = await Booking.countDocuments({ status: "booked" });

        // Today's date range
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Find today's meals
        const todaysMeals = await Meal.find({
            date: { $gte: startOfToday, $lte: endOfToday }
        });

        const todaysMealIds = todaysMeals.map((m) => m._id);

        const todaysBookings = await Booking.countDocuments({
            meal: { $in: todaysMealIds }
        });

        const todaysRedeemed = await Booking.countDocuments({
            meal: { $in: todaysMealIds },
            status: "redeemed"
        });

        const todaysCancelled = await Booking.countDocuments({
            meal: { $in: todaysMealIds },
            status: "cancelled"
        });

        const todaysPending = todaysBookings - todaysRedeemed - todaysCancelled;

        // Overall redemption rate
        const totalConsidered = redeemedBookings + activeBookings;
        const redemptionRate = totalConsidered > 0
            ? Math.round((redeemedBookings / totalConsidered) * 100)
            : 0;

        // Total rebate sum
        const rebateAggregation = await Booking.aggregate([
            { $match: { status: "cancelled" } },
            { $group: { _id: null, totalRebate: { $sum: "$rebateCredited" } } }
        ]);
        const totalRebatesGiven = rebateAggregation[0]?.totalRebate || 0;

        return res.status(200).json({
            success: true,
            summary: {
                totalMeals,
                totalBookings,
                redeemedBookings,
                cancelledBookings,
                activeBookings,
                redemptionRate,
                totalRebatesGiven,
                today: {
                    mealsCount: todaysMeals.length,
                    bookings: todaysBookings,
                    redeemed: todaysRedeemed,
                    cancelled: todaysCancelled,
                    pending: Math.max(0, todaysPending)
                }
            }
        });
    } catch (error) {
        console.error("Admin overview error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load executive summary."
        });
    }
};

// ========================================================
// 2. Attendance Statistics & Trends for Recharts
// ========================================================
const getAttendanceStats = async (req, res) => {
    try {
        // Aggregate bookings by mealType
        const mealTypeStats = await Booking.aggregate([
            {
                $lookup: {
                    from: "meals",
                    localField: "meal",
                    foreignField: "_id",
                    as: "mealDetails"
                }
            },
            { $unwind: "$mealDetails" },
            {
                $group: {
                    _id: "$mealDetails.mealType",
                    totalBooked: { $sum: 1 },
                    redeemed: {
                        $sum: { $cond: [{ $eq: ["$status", "redeemed"] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ["$status", "booked"] }, 1, 0] }
                    }
                }
            }
        ]);

        const formattedMealTypeStats = ["breakfast", "lunch", "snacks", "dinner"].map((type) => {
            const found = mealTypeStats.find((s) => s._id === type);
            return {
                name: type.charAt(0).toUpperCase() + type.slice(1),
                totalBooked: found ? found.totalBooked : 0,
                redeemed: found ? found.redeemed : 0,
                cancelled: found ? found.cancelled : 0,
                pending: found ? found.pending : 0
            };
        });

        // 7-day attendance trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyStats = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    total: { $sum: 1 },
                    redeemed: {
                        $sum: { $cond: [{ $eq: ["$status", "redeemed"] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            success: true,
            mealTypeStats: formattedMealTypeStats,
            dailyStats
        });
    } catch (error) {
        console.error("Attendance stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate attendance charts."
        });
    }
};

// ========================================================
// 3. Food Waste Reporting & Logging
// ========================================================
const getFoodWasteReport = async (req, res) => {
    try {
        const wasteLogs = await WasteLog.find()
            .populate("meal", "mealType date capacity")
            .populate("loggedBy", "name email")
            .sort({ date: -1 })
            .limit(20);

        // Calculate potential unredeemed waste across all past meals
        const now = new Date();
        const pastMeals = await Meal.find({
            date: { $lt: now }
        });

        let totalUnredeemedPortions = 0;
        for (const m of pastMeals) {
            const unredeemedCount = await Booking.countDocuments({
                meal: m._id,
                status: "booked"
            });
            totalUnredeemedPortions += unredeemedCount;
        }

        // Each unserved prepared meal portion is estimated at 0.35 kg food waste
        const estimatedWasteKg = Math.round(totalUnredeemedPortions * 0.35 * 10) / 10;
        const estimatedEconomicWaste = Math.round(totalUnredeemedPortions * 65);

        // Waste log totals
        const totalLoggedWasteKg = wasteLogs.reduce((acc, log) => acc + (log.estimatedWasteKg || 0), 0);
        const totalLoggedCost = wasteLogs.reduce((acc, log) => acc + (log.estimatedWasteCost || 0), 0);

        return res.status(200).json({
            success: true,
            wasteSummary: {
                totalUnredeemedPortions,
                estimatedWasteKg,
                estimatedEconomicWaste,
                totalLoggedWasteKg,
                totalLoggedCost,
                averageWastePerMealKg: 0.35
            },
            wasteLogs
        });
    } catch (error) {
        console.error("Food waste report error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load food waste metrics."
        });
    }
};

const logFoodWaste = async (req, res) => {
    try {
        const { mealId, preparedPortions, consumedPortions, notes } = req.body;

        if (!mealId || preparedPortions === undefined || consumedPortions === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide meal ID, prepared portions, and consumed portions."
            });
        }

        const meal = await Meal.findById(mealId);
        if (!meal) {
            return res.status(404).json({
                success: false,
                message: "Meal not found."
            });
        }

        const prepared = Number(preparedPortions);
        const consumed = Number(consumedPortions);
        const wasted = Math.max(0, prepared - consumed);
        const estimatedWasteKg = Math.round(wasted * 0.35 * 10) / 10;
        const costPerKg = 110;
        const estimatedWasteCost = Math.round(estimatedWasteKg * costPerKg);

        const log = await WasteLog.create({
            meal: mealId,
            mealType: meal.mealType,
            date: meal.date,
            preparedPortions: prepared,
            consumedPortions: consumed,
            wastedPortions: wasted,
            estimatedWasteKg,
            costPerKg,
            estimatedWasteCost,
            notes: notes || "",
            loggedBy: req.user.userId
        });

        return res.status(201).json({
            success: true,
            message: "Food waste entry recorded successfully.",
            log
        });
    } catch (error) {
        console.error("Log food waste error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to log food waste."
        });
    }
};

// ========================================================
// 4. Billing & Rebate Ledger
// ========================================================
const getBillingAndRebates = async (req, res) => {
    try {
        const isStudent = req.user.role === "student";

        if (isStudent) {
            // Student's personal billing summary
            const user = await User.findById(req.user.userId);
            const myBookings = await Booking.find({ student: req.user.userId }).populate("meal");

            const bookedCount = myBookings.filter((b) => b.status === "booked").length;
            const redeemedCount = myBookings.filter((b) => b.status === "redeemed").length;
            const cancelledCount = myBookings.filter((b) => b.status === "cancelled").length;

            const totalRebatesEarned = myBookings
                .filter((b) => b.status === "cancelled")
                .reduce((acc, b) => acc + (b.rebateCredited || 0), 0);

            const baseMonthlyPlan = 3200; // Standard monthly mess plan
            const netPayable = Math.max(0, baseMonthlyPlan - totalRebatesEarned);

            return res.status(200).json({
                success: true,
                billing: {
                    studentName: user.name,
                    studentId: user.studentId,
                    hostel: user.hostel,
                    roomNumber: user.roomNumber,
                    baseMonthlyPlan,
                    balance: user.balance,
                    totalRebatesEarned,
                    netPayable,
                    stats: {
                        totalBookings: myBookings.length,
                        active: bookedCount,
                        redeemed: redeemedCount,
                        cancelled: cancelledCount
                    },
                    history: myBookings.slice(0, 15)
                }
            });
        } else {
            // Admin ledger
            const allCancelled = await Booking.find({ status: "cancelled" })
                .populate("student", "name email studentId hostel")
                .populate("meal", "mealType date price rebateAmount")
                .sort({ updatedAt: -1 });

            const totalRebatesPaid = allCancelled.reduce((acc, b) => acc + (b.rebateCredited || 0), 0);

            return res.status(200).json({
                success: true,
                adminLedger: {
                    totalRebatesPaid,
                    cancelledCount: allCancelled.length,
                    rebateEntries: allCancelled
                }
            });
        }
    } catch (error) {
        console.error("Billing and rebates error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to compute billing and rebate ledger."
        });
    }
};

module.exports = {
    getAdminOverview,
    getAttendanceStats,
    getFoodWasteReport,
    logFoodWaste,
    getBillingAndRebates
};
