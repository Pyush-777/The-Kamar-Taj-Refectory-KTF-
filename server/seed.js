const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const QRCode = require("qrcode");
require("dotenv").config();

const User = require("./models/User");
const Meal = require("./models/Meal");
const Booking = require("./models/Booking");
const WasteLog = require("./models/WasteLog");
const Notification = require("./models/Notification");

const seedDatabase = async () => {
    try {
        console.log("Connecting to MongoDB for seeding...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully.");

        // Clean existing seed if needed or update
        console.log("Setting up demo users...");

        const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
        const studentPasswordHash = await bcrypt.hash("Student@12345", 12);

        // 1. Upsert Admin User
        let admin = await User.findOne({ email: "admin@kamartaj.edu" });
        if (!admin) {
            admin = await User.create({
                name: "Ancient One (Mess Warden)",
                email: "admin@kamartaj.edu",
                password: adminPasswordHash,
                role: "admin",
                studentId: "FAC-001",
                hostel: "Administration Wing",
                roomNumber: "W-101"
            });
            console.log("Created admin: admin@kamartaj.edu / Admin@12345");
        } else {
            admin.role = "admin";
            admin.password = adminPasswordHash;
            await admin.save();
            console.log("Admin account updated.");
        }

        // 2. Upsert Student User
        let student = await User.findOne({ email: "student@kamartaj.edu" });
        if (!student) {
            student = await User.create({
                name: "Mradul Kumar",
                email: "student@kamartaj.edu",
                password: studentPasswordHash,
                role: "student",
                studentId: "20253161",
                balance: 1420,
                totalRebates: 120,
                hostel: "Kamar-Taj Hall A",
                roomNumber: "302"
            });
            console.log("Created student: student@kamartaj.edu / Student@12345");
        } else {
            student.password = studentPasswordHash;
            await student.save();
        }

        // 3. Upsert Student 2
        let student2 = await User.findOne({ email: "pyush@kamartaj.edu" });
        if (!student2) {
            student2 = await User.create({
                name: "Pyush Kumar Singh",
                email: "pyush@kamartaj.edu",
                password: studentPasswordHash,
                role: "student",
                studentId: "20253214",
                balance: 1560,
                totalRebates: 60,
                hostel: "Kamar-Taj Hall B",
                roomNumber: "214"
            });
        }

        // 4. Create sample meals for today and tomorrow
        console.log("Creating scheduled meals...");
        const now = new Date();

        const getTodayAt = (hours, minutes) => {
            const d = new Date();
            d.setHours(hours, minutes, 0, 0);
            return d;
        };

        const getTomorrowAt = (hours, minutes) => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(hours, minutes, 0, 0);
            return d;
        };

        const sampleMeals = [
            {
                mealType: "breakfast",
                date: getTomorrowAt(8, 0),
                bookingDeadline: getTomorrowAt(6, 30),
                serviceWindow: { start: "07:30", end: "09:45" },
                menu: ["Masala Dosa", "Coconut Chutney", "Hot Sambar", "Boiled Eggs", "Filter Coffee"],
                capacity: 180,
                bookedCount: 42,
                price: 45,
                rebateAmount: 35,
                isBookingOpen: true,
                createdBy: admin._id
            },
            {
                mealType: "lunch",
                date: getTomorrowAt(13, 0),
                bookingDeadline: getTomorrowAt(11, 0),
                serviceWindow: { start: "12:30", end: "14:30" },
                menu: ["Shahi Paneer", "Dal Makhani", "Jeera Rice", "Butter Naan", "Boondi Raita", "Gulab Jamun"],
                capacity: 220,
                bookedCount: 68,
                price: 85,
                rebateAmount: 65,
                isBookingOpen: true,
                createdBy: admin._id
            },
            {
                mealType: "snacks",
                date: getTomorrowAt(17, 30),
                bookingDeadline: getTomorrowAt(16, 0),
                serviceWindow: { start: "17:00", end: "18:30" },
                menu: ["Aloo Samosa with Mint Chutney", "Veg Cutlets", "Masala Chai"],
                capacity: 150,
                bookedCount: 25,
                price: 35,
                rebateAmount: 25,
                isBookingOpen: true,
                createdBy: admin._id
            },
            {
                mealType: "dinner",
                date: getTomorrowAt(20, 0),
                bookingDeadline: getTomorrowAt(18, 30),
                serviceWindow: { start: "19:45", end: "21:45" },
                menu: ["Kadai Mushroom / Chicken Curry", "Yellow Dal Tadka", "Steamed Basmati", "Tandoori Roti", "Ice Cream"],
                capacity: 200,
                bookedCount: 84,
                price: 90,
                rebateAmount: 70,
                isBookingOpen: true,
                createdBy: admin._id
            }
        ];

        for (const mealData of sampleMeals) {
            // Find if exists
            const existing = await Meal.findOne({
                mealType: mealData.mealType,
                date: {
                    $gte: new Date(new Date(mealData.date).setHours(0, 0, 0, 0)),
                    $lte: new Date(new Date(mealData.date).setHours(23, 59, 59, 999))
                }
            });

            if (!existing) {
                const createdMeal = await Meal.create(mealData);
                console.log(`Created meal schedule: ${mealData.mealType}`);

                // Create a booking for Mradul Kumar
                if (mealData.mealType === "breakfast" || mealData.mealType === "lunch") {
                    const bookingCode = crypto.randomBytes(24).toString("hex");
                    const qrCode = await QRCode.toDataURL(bookingCode, { errorCorrectionLevel: "H", margin: 2 });

                    await Booking.create({
                        student: student._id,
                        meal: createdMeal._id,
                        bookingCode,
                        qrCode,
                        status: "booked"
                    });
                }
            }
        }

        // Add some notifications
        await Notification.create({
            user: student._id,
            title: "Welcome to The Kamar-Taj Refectory",
            message: "Your dining account is active. You can reserve meals, receive instant entry QR passes, and earn rebates on advance cancellations.",
            type: "system"
        });

        console.log("Seeding completed successfully!");
        console.log("Default Admin: admin@kamartaj.edu | Admin@12345");
        console.log("Default Student: student@kamartaj.edu | Student@12345");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
};

seedDatabase();
