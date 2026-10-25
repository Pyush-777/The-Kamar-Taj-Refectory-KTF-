
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const QRCode = require("qrcode");
require("dotenv").config();

const User = require("./models/User");
const Meal = require("./models/Meal");
const Booking = require("./models/Booking");
const Notification = require("./models/Notification");

const seedDatabase = async () => {
    try {
        console.log("Connecting to MongoDB for seeding...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully.");

        // 1. Create or update the demo admin account
        console.log("Setting up demo users...");

        const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
        const studentPasswordHash = await bcrypt.hash("Student@12345", 12);

        let admin = await User.findOne({
            email: "admin@kamartaj.edu"
        });

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

            console.log("Created demo admin.");
        } else {
            admin.role = "admin";
            admin.password = adminPasswordHash;
            await admin.save();

            console.log("Updated demo admin.");
        }

        // 2. Create or update the first demo student
        let student = await User.findOne({
            email: "student@kamartaj.edu"
        });

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

            console.log("Created demo student.");
        } else {
            student.password = studentPasswordHash;
            await student.save();
        }

        // 3. Create the second demo student if missing
        let student2 = await User.findOne({
            email: "pyush@kamartaj.edu"
        });

        if (!student2) {
            await User.create({
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

            console.log("Created second demo student.");
        }

        // 4. Generate tomorrow's meal dates and deadlines
        console.log("Creating or updating scheduled meals...");

        const getTomorrowAt = (hours, minutes) => {
            const date = new Date();

            date.setDate(date.getDate() + 1);
            date.setHours(hours, minutes, 0, 0);

            return date;
        };

        const sampleMeals = [
            {
                mealType: "breakfast",
                date: getTomorrowAt(8, 0),
                bookingDeadline: getTomorrowAt(6, 30),
                serviceWindow: {
                    start: "07:30",
                    end: "09:45"
                },
                menu: [
                    "Masala Dosa",
                    "Coconut Chutney",
                    "Hot Sambar",
                    "Boiled Eggs",
                    "Filter Coffee"
                ],
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
                serviceWindow: {
                    start: "12:30",
                    end: "14:30"
                },
                menu: [
                    "Shahi Paneer",
                    "Dal Makhani",
                    "Jeera Rice",
                    "Butter Naan",
                    "Boondi Raita",
                    "Gulab Jamun"
                ],
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
                serviceWindow: {
                    start: "17:00",
                    end: "18:30"
                },
                menu: [
                    "Aloo Samosa with Mint Chutney",
                    "Veg Cutlets",
                    "Masala Chai"
                ],
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
                serviceWindow: {
                    start: "19:45",
                    end: "21:45"
                },
                menu: [
                    "Kadai Mushroom / Chicken Curry",
                    "Yellow Dal Tadka",
                    "Steamed Basmati",
                    "Tandoori Roti",
                    "Ice Cream"
                ],
                capacity: 200,
                bookedCount: 84,
                price: 90,
                rebateAmount: 70,
                isBookingOpen: true,
                createdBy: admin._id
            }
        ];

        for (const mealData of sampleMeals) {
            // Find a meal of this type scheduled for the same calendar day.
            const startOfDay = new Date(mealData.date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(mealData.date);
            endOfDay.setHours(23, 59, 59, 999);

            const existing = await Meal.findOne({
                mealType: mealData.mealType,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            if (!existing) {
                // No meal exists for tomorrow: create it.
                const createdMeal = await Meal.create(mealData);

                console.log(`Created ${mealData.mealType} meal.`);

                // Add a demo booking only when creating a new meal.
                if (
                    mealData.mealType === "breakfast" ||
                    mealData.mealType === "lunch"
                ) {
                    const bookingCode = crypto
                        .randomBytes(24)
                        .toString("hex");

                    const qrCode = await QRCode.toDataURL(
                        bookingCode,
                        {
                            errorCorrectionLevel: "H",
                            margin: 2
                        }
                    );

                    await Booking.create({
                        student: student._id,
                        meal: createdMeal._id,
                        bookingCode,
                        qrCode,
                        status: "booked"
                    });

                    console.log(
                        `Created demo booking for ${mealData.mealType}.`
                    );
                }
            } else {
                // Update the existing demo meal's schedule and menu.
                // Preserve its ID and current bookedCount.
                existing.date = mealData.date;
                existing.bookingDeadline = mealData.bookingDeadline;
                existing.serviceWindow = mealData.serviceWindow;
                existing.menu = mealData.menu;
                existing.capacity = mealData.capacity;
                existing.price = mealData.price;
                existing.rebateAmount = mealData.rebateAmount;
                existing.createdBy = admin._id;

                // Do not reopen a meal if its deadline has already passed.
                existing.isBookingOpen =
                    new Date(mealData.bookingDeadline) > new Date() &&
                    Number(existing.bookedCount || 0) <
                        Number(mealData.capacity);

                await existing.save();

                console.log(
                    `Updated ${mealData.mealType} meal schedule.`
                );
            }
        }

        // 5. Create a welcome notification only if one does not already exist.
        const existingNotification = await Notification.findOne({
            user: student._id,
            title: "Welcome to The Kamar-Taj Refectory"
        });

        if (!existingNotification) {
            await Notification.create({
                user: student._id,
                title: "Welcome to The Kamar-Taj Refectory",
                message:
                    "Your dining account is active. You can reserve meals, " +
                    "receive instant entry QR passes, and earn rebates " +
                    "on advance cancellations.",
                type: "system"
            });

            console.log("Created welcome notification.");
        }

        console.log("Seeding completed successfully!");
        console.log("Admin: admin@kamartaj.edu | Admin@12345");
        console.log("Student: student@kamartaj.edu | Student@12345");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);

        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    }
};

seedDatabase();
