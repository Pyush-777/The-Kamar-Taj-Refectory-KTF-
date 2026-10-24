const Meal = require("../models/Meal");
const Booking = require("../models/Booking");

// Create a new meal schedule (admin only)
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
        if (!mealType || !date || !menu || !bookingDeadline || !capacity) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required meal details."
            });
        }

        // Validate menu
        const menuArray = Array.isArray(menu)
            ? menu
            : String(menu).split(",").map(i => i.trim()).filter(Boolean);

        if (menuArray.length === 0) {
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

        if (
            Number.isNaN(mealDate.getTime()) ||
            Number.isNaN(deadline.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid dates."
            });
        }

        if (deadline >= mealDate) {
            return res.status(400).json({
                success: false,
                message: "Booking deadline must be before the meal date."
            });
        }

        // Create the meal in MongoDB
        const meal = await Meal.create({
            mealType,
            date: mealDate,
            menu: menuArray.map(item => String(item).trim()).filter(Boolean),
            bookingDeadline: deadline,
            capacity: capNum,
            serviceWindow: serviceWindow || { start: "08:00", end: "10:00" },
            price: Number(price) || (mealType === "breakfast" ? 40 : mealType === "snacks" ? 30 : 80),
            rebateAmount: Number(rebateAmount) || (mealType === "breakfast" ? 30 : mealType === "snacks" ? 20 : 60),
            createdBy: req.user.userId
        });

        return res.status(201).json({
            success: true,
            message: "Meal schedule created successfully.",
            meal
        });
    } catch (error) {
        // Handle duplicate meal schedules
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A schedule for this meal type and date already exists."
            });
        }

        console.error("Create meal error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to create meal schedule."
        });
    }
};

// Get all meals (students and admins)
const getMeals = async (req, res) => {
    try {
        const { date, mealType } = req.query;
        let query = {};

        if (mealType && mealType !== "all") {
            query.mealType = mealType;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
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
        console.error("Get meals error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve meal schedules."
        });
    }
};

// Toggle meal booking open/closed
const toggleMealStatus = async (req, res) => {
    try {
        const { mealId } = req.params;
        const meal = await Meal.findById(mealId);

        if (!meal) {
            return res.status(404).json({
                success: false,
                message: "Meal not found."
            });
        }

        meal.isBookingOpen = !meal.isBookingOpen;
        await meal.save();

        return res.status(200).json({
            success: true,
            message: `Booking has been ${meal.isBookingOpen ? "opened" : "closed"} for this meal.`,
            meal
        });
    } catch (error) {
        console.error("Toggle meal status error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update meal status."
        });
    }
};

// Delete a meal schedule (Admin only)
const deleteMeal = async (req, res) => {
    try {
        const { mealId } = req.params;

        // Check if there are active bookings
        const activeBookings = await Booking.countDocuments({
            meal: mealId,
            status: "booked"
        });

        if (activeBookings > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete meal: ${activeBookings} active booking(s) exist. Please close bookings instead.`
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
        console.error("Delete meal error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete meal."
        });
    }
};

// Export controller functions
module.exports = {
    createMeal,
    getMeals,
    toggleMealStatus,
    deleteMeal
};
