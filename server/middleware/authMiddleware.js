
const jwt = require("jsonwebtoken");

// Authentication middleware
const protect = (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from .env");

            return res.status(500).json({
                success: false,
                message: "Server authentication configuration error."
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please log in."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        return next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                code: "TOKEN_EXPIRED",
                message: "Session expired. Please log in again."
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                code: "INVALID_TOKEN",
                message: "Invalid token. Please log in again."
            });
        }

        console.error("JWT verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Authentication failed."
        });
    }
};

// Role authorization middleware
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Please log in first."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action."
            });
        }

        return next();
    };
};

module.exports = {
    protect,
    authorizeRoles
};
