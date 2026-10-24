const express = require("express");

const {
    createMeal,
    getMeals,
    toggleMealStatus,
    deleteMeal
} = require("../controllers/mealController");

const {
    protect,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get upcoming meals (any logged-in user)
router.get("/", protect, getMeals);

// Create a meal (admin only)
router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    createMeal
);

// Toggle booking open/close status (admin only)
router.patch(
    "/:mealId/toggle-status",
    protect,
    authorizeRoles("admin"),
    toggleMealStatus
);

// Delete a meal schedule (admin only)
router.delete(
    "/:mealId",
    protect,
    authorizeRoles("admin"),
    deleteMeal
);

module.exports = router;
