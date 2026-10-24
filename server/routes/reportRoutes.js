const express = require("express");
const {
    getAdminOverview,
    getAttendanceStats,
    getFoodWasteReport,
    logFoodWaste,
    getBillingAndRebates
} = require("../controllers/reportController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Executive summary & key metrics (Admin only)
router.get("/overview", protect, authorizeRoles("admin"), getAdminOverview);

// Attendance charts & trend data (Admin only)
router.get("/attendance", protect, authorizeRoles("admin"), getAttendanceStats);

// Food waste reporting (Admin only)
router.get("/waste", protect, authorizeRoles("admin"), getFoodWasteReport);

// Log leftover food waste (Admin only)
router.post("/waste/log", protect, authorizeRoles("admin"), logFoodWaste);

// Billing & rebate ledger (Students view personal, Admin views all)
router.get("/billing", protect, getBillingAndRebates);

module.exports = router;
