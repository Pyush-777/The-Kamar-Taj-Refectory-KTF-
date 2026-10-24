
// Import JWT
const jwt = require("jsonwebtoken");


// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================
const protect = (req, res, next) => {
    try {
        // Check whether the JWT secret exists
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from .env");

            return res.status(500).json({
                success: false,
                message: "Server authentication configuration error."
            });
        }

        // Get the Authorization header
        const authHeader = req.headers.authorization;

        // Check whether a Bearer token was provided
        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please log in."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach verified information to the request
        req.user = decoded;

        // Continue to the route
        return next();

    } catch (error) {
        console.error("JWT Error Name:", error.name);
        console.error("JWT Error Message:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};


// ========================================
// ROLE AUTHORIZATION MIDDLEWARE
// ========================================
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {

        // Ensure authentication happened first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Please log in first."
            });
        }

        // Check the verified user's role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action."
            });
        }

        // Allow the request to continue
        return next();
    };
};


// Export both middleware functions
module.exports = {
    protect,
    authorizeRoles
};
