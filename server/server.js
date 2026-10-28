
// Import required packages
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Import MongoDB connection function
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const mealRoutes = require("./routes/mealRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const testRoutes = require("./routes/testRoutes");

// Create Express application
const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/test", testRoutes);

// Home route
app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        project: "The Kamar-Taj Refectory",
        subtitle: "A Smart College Mess Management System with QR-Based Meal Check-In",
        team: "OPM (ID: 57)",
        version: "2.0.0",
        message: "Refectory server running smoothly."
    });
});

// Health-check route
app.get("/api/health", (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;

    return res.status(isConnected ? 200 : 503).json({
        success: isConnected,
        server: "running",
        database: isConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
    });
});

// Handle unknown routes
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// Start the application
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log("===============================================");
            console.log(" The Kamar-Taj Refectory Backend Active        ");
            console.log(` Port: ${PORT}                                 `);
            console.log(" System: MERN QR-Based Mess Check-In Ready     ");
            console.log("===============================================");
        });
    } catch (error) {
        console.error("Failed to start the server:", error.message);
        process.exit(1);
    }
};

// Run the application
startServer();
