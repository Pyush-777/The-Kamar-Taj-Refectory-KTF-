const mongoose = require("mongoose");

const wasteLogSchema = new mongoose.Schema(
    {
        meal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meal",
            required: true
        },
        mealType: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        preparedPortions: {
            type: Number,
            required: true,
            min: 0
        },
        consumedPortions: {
            type: Number,
            required: true,
            min: 0
        },
        wastedPortions: {
            type: Number,
            required: true,
            min: 0
        },
        estimatedWasteKg: {
            type: Number,
            required: true,
            min: 0
        },
        costPerKg: {
            type: Number,
            default: 110
        },
        estimatedWasteCost: {
            type: Number,
            default: 0
        },
        notes: {
            type: String,
            default: ""
        },
        loggedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const WasteLog = mongoose.model("WasteLog", wasteLogSchema);

module.exports = WasteLog;
