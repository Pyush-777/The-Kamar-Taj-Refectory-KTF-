
// Import Mongoose
const mongoose = require("mongoose");

// Define the user schema
const userSchema = new mongoose.Schema(
    {
        // User's full name
        name: {
            type: String,
            required: true,
            trim: true
        },

        // Email must be unique
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Stores the hashed password, not the original password
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        // User role
        role: {
            type: String,
            enum: ["student", "admin"],
            default: "student"
        },

        // Optional student identification number
        studentId: {
            type: String,
            default: null
        },

        // Student mess wallet / credit balance (INR)
        balance: {
            type: Number,
            default: 1500
        },

        // Accumulated rebates from meal cancellations (INR)
        totalRebates: {
            type: Number,
            default: 0
        },

        // Hostel block and room number
        hostel: {
            type: String,
            default: "Kamar-Taj Hall A"
        },
        roomNumber: {
            type: String,
            default: "204"
        }
    },
    {
        timestamps: true
    }
);

// Create the model
const User = mongoose.model("User", userSchema);

// Export the model
module.exports = User;

