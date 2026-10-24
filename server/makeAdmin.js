
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
const makeAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected!");
        // Enter the email of your already registered account
        const email = "admin.test@example.com";
        // Find the account and change its role
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found. Register this account first.");
            return;
        }
        user.role = "admin";
        await user.save();
        console.log("Admin role assigned successfully!");
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

makeAdmin();
