// Import Mongoose
const mongoose = require("mongoose");

// Define the meal schema
const mealSchema = new mongoose.Schema(
    {
        // Type of meal
        mealType: {
            type: String,
            enum: ["breakfast", "lunch", "snacks", "dinner"],
            required: true
        },

        // Date on which the meal will be served
        date: {
            type: Date,
            required: true
        },

        // Service window times (e.g. 07:30 - 09:30)
        serviceWindow: {
            start: {
                type: String,
                default: "08:00"
            },
            end: {
                type: String,
                default: "10:00"
            }
        },

        // Menu items for this meal
        menu: {
            type: [String],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "At least one menu item is required."
            }
        },

        // Last time students can book this meal
        bookingDeadline: {
            type: Date,
            required: true
        },

        // Maximum number of students allowed
        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        // Number of students who have booked
        bookedCount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Standard meal price (INR)
        price: {
            type: Number,
            default: 60,
            min: 0
        },

        // Rebate credited to student if cancelled before cutoff (INR)
        rebateAmount: {
            type: Number,
            default: 45,
            min: 0
        },

        // Whether students can book this meal
        isBookingOpen: {
            type: Boolean,
            default: true
        },

        // Admin who created the meal
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate schedules for the same meal type and date
mealSchema.index(
    { mealType: 1, date: 1 },
    { unique: true }
);

// Create the Meal model
const Meal = mongoose.model("Meal", mealSchema);

// Export the model
module.exports = Meal;

