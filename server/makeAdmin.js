const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

const makeAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected!");

        // Enter the emails of already registered accounts
        const emails = [
            "admin123@gmail.com"
        ];

        // Find each account and change its role
        for (const email of emails) {
            const user = await User.findOne({ email });

            if (!user) {
                console.log(`User not found: ${email}. Register this account first.`);
                continue;
            }

            user.role = "admin";
            await user.save();

            console.log(`Admin role assigned successfully to ${email}!`);
        }

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

makeAdmin();