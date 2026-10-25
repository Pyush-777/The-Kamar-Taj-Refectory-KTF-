
const Meal = require("../models/Meal");
const Booking = require("../models/Booking");

// ==========================================
// 1. Create a new meal schedule (Admin only)
// ==========================================
const createMeal = async (req, res) => {
    try {
        const {
            mealType,
            date,
            menu,
            bookingDeadline,
            capacity,
            serviceWindow,
            price,
            rebateAmount
        } = req.body;

        // Validate required fields
        if (
            !mealType ||
            !date ||
            !menu ||
            !bookingDeadline ||
            capacity === undefined ||
            capacity === null ||
            capacity === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required meal details."
            });
        }

        // Validate the meal type
        const validMealTypes = [
            "breakfast",
            "lunch",
            "snacks",
            "dinner"
        ];

        if (!validMealTypes.includes(mealType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid meal type."
            });
        }

        // Validate menu
        const menuArray = Array.isArray(menu)
            ? menu
            : String(menu).split(",");

        const cleanedMenu = menuArray
            .map((item) => String(item).trim())
            .filter(Boolean);

        if (cleanedMenu.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Menu must contain at least one item."
            });
        }

        // Validate capacity
        const capNum = Number(capacity);

        if (!Number.isInteger(capNum) || capNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive whole number."
            });
        }

        // Validate dates
        const mealDate = new Date(date);
        const deadline = new Date(bookingDeadline);
        const now = new Date();

        if (
            Number.isNaN(mealDate.getTime()) ||
            Number.isNaN(deadline.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid dates."
            });
        }

        // The meal must be in the future
        if (mealDate <= now) {
            return res.status(400).json({
                success: false,
                message: "The meal date must be in the future."
            });
        }

        // The booking cutoff must be before the meal
        if (deadline >= mealDate) {
            return res.status(400).json({
                success: false,
                message: "Booking deadline must be before the meal date."
            });
        }

        // The deadline must not already have passed
        if (deadline <= now) {
            return res.status(400).json({
                success: false,
                message: "Booking deadline must be in the future."
            });
        }

        // Check for an existing schedule on the same calendar day
        const startOfDay = new Date(mealDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(mealDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingMeal = await Meal.findOne({
            mealType,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (existingMeal) {
            return res.status(409).json({
                success: false,
                message:
                    "A schedule for this meal type and date already exists."
            });
        }

        // Create the meal
        const meal = await Meal.create({
            mealType,
            date: mealDate,
            menu: cleanedMenu,
            bookingDeadline: deadline,
            capacity: capNum,
            bookedCount: 0,
            isBookingOpen: true,
            serviceWindow: serviceWindow || {
                start: "08:00",
                end: "10:00"
            },
            price:
                price !== undefined && price !== ""
                    ? Number(price)
                    : mealType === "breakfast"
                      ? 40
                      : mealType === "snacks"
                        ? 30
                        : 80,
            rebateAmount:
                rebateAmount !== undefined && rebateAmount !== ""
                    ? Number(rebateAmount)
                    : mealType === "breakfast"
                      ? 30
                      : mealType === "snacks"
                        ? 20
                        : 60,
            createdBy: req.user.userId
        });

        return res.status(201).json({
            success: true,
            message: "Meal schedule created successfully.",
            meal
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "A schedule for this meal type and date already exists."
            });
        }

        console.error("Create meal error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create meal schedule."
        });
    }
};

// ==========================================
// 2. Get meal schedules
// Students: upcoming meals by default
// Admins: all meals by default
// ==========================================
const getMeals = async (req, res) => {
    try {
        const { date, mealType, includePast } = req.query;

        const query = {};

        // Filter by meal type
        if (mealType && mealType !== "all") {
            const validMealTypes = [
                "breakfast",
                "lunch",
                "snacks",
                "dinner"
            ];

            if (!validMealTypes.includes(mealType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid meal type."
                });
            }

            query.mealType = mealType;
        }

        // Filter by a specific calendar day
        if (date) {
            const selectedDate = new Date(date);

            if (Number.isNaN(selectedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date filter."
                });
            }

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            query.date = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        } else {
            // Determine whether this request is from an admin.
            // Adjust this if your application stores roles differently.
            const isAdmin = req.user?.role === "admin";

            // Student requests return upcoming meals by default.
            // Admins can view all meals for management purposes.
            if (!isAdmin && includePast !== "true") {
                query.date = {
                    $gt: new Date()
                };
            }
        }

        const meals = await Meal.find(query)
            .sort({ date: 1, mealType: 1 })
            .populate("createdBy", "name email");

        return res.status(200).json({
            success: true,
            count: meals.length,
            meals
        });
    } catch (error) {
        console.error("Get meals error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve meal schedules."
        });
    }
};

// ==========================================
// 3. Toggle meal booking open/closed
// ==========================================
const toggleMealStatus = async (req, res) => {
    try {
        const { mealId } = req.params;

        if (!require("mongoose").isValidObjectId(mealId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid meal ID."
            });
        }

        const meal = await Meal.findById(mealId);

        if (!meal) {
            return res.status(404).json({
                success: false,
                message: "Meal not found."
            });
        }

        // Do not allow reopening an expired schedule
        if (
            new Date(meal.bookingDeadline) <= new Date() ||
            new Date(meal.date) <= new Date()
        ) {
            meal.isBookingOpen = false;
            await meal.save();

            return res.status(400).json({
                success: false,
                message:
                    "Bookings cannot be opened because the deadline or meal time has passed.",
                meal
            });
        }

        meal.isBookingOpen = !meal.isBookingOpen;
        await meal.save();

        return res.status(200).json({
            success: true,
            message:
                `Booking has been ${meal.isBookingOpen ? "opened" : "closed"} for this meal.`,
            meal
        });
    } catch (error) {
        console.error("Toggle meal status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update meal status."
        });
    }
};

// ==========================================
// 4. Delete a meal schedule (Admin only)
// ==========================================
const deleteMeal = async (req, res) => {
    try {
        const { mealId } = req.params;

        if (!require("mongoose").isValidObjectId(mealId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid meal ID."
            });
        }

        // Prevent deletion if active bookings exist
        const activeBookings = await Booking.countDocuments({
            meal: mealId,
            status: "booked"
        });

        if (activeBookings > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete meal: ${activeBookings} active booking(s) exist. ` +
                    "Please close bookings instead."
            });
        }

        const meal = await Meal.findByIdAndDelete(mealId);

        if (!meal) {
            return res.status(404).json({
                success: false,
                message: "Meal not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Meal schedule deleted successfully."
        });
    } catch (error) {
        console.error("Delete meal error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete meal."
        });
    }
};

// ==========================================
// Export controller functions
// ==========================================
module.exports = {
    createMeal,
    getMeals,
    toggleMealStatus,
    deleteMeal
};
