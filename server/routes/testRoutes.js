
// Import Express
const express = require("express");

// Import authentication middleware
const {
    protect,
    authorizeRoles
} = require("../middleware/authMiddleware");

// Create router
const router = express.Router();


// Dashboard accessible to students and admins
router.get(
    "/dashboard",
    protect,
    authorizeRoles("student", "admin"),
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Welcome to your dashboard!",
            userId: req.user.userId,
            role: req.user.role
        });
    }
);


// Dashboard accessible only to admins
router.get(
    "/admin",
    protect,
    authorizeRoles("admin"),
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Welcome to the admin dashboard!",
            userId: req.user.userId,
            role: req.user.role
        });
    }
);

module.exports = router;
