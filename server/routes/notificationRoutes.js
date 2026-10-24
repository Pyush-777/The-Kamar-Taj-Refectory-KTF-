const express = require("express");
const {
    getMyNotifications,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", protect, getMyNotifications);
router.patch("/:notificationId/read", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);

module.exports = router;
