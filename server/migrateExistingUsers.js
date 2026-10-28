/**
 * Migration Script for Existing User Accounts
 *
 * Requirements:
 * - Do not automatically mark all existing accounts as verified in the schema default.
 * - Provide a safe, transparent migration utility for administrators.
 * - Preserve all existing passwords, wallet balances, totalRebates, bookings, and profile data.
 *
 * Usage:
 *   node migrateExistingUsers.js --dry-run
 *   node migrateExistingUsers.js --confirm
 *   node migrateExistingUsers.js --email=student@kamartaj.edu
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/.env" });
const User = require("./models/User");

const runMigration = async () => {
    const args = process.argv.slice(2);
    const isDryRun = args.includes("--dry-run");
    const isConfirmed = args.includes("--confirm");
    const emailArg = args.find((a) => a.startsWith("--email="));
    const targetEmail = emailArg ? emailArg.split("=")[1].trim().toLowerCase() : null;

    if (!isDryRun && !isConfirmed && !targetEmail) {
        console.log("==================================================================");
        console.log(" The Kamar-Taj Refectory — Safe User Verification Migration Tool  ");
        console.log("==================================================================");
        console.log("This utility safely sets 'emailVerified: true' for pre-existing accounts");
        console.log("without altering balances, rebates, passwords, or booking history.\n");
        console.log("Options:");
        console.log("  node migrateExistingUsers.js --dry-run");
        console.log("      Preview which accounts would be migrated without making changes.\n");
        console.log("  node migrateExistingUsers.js --confirm");
        console.log("      Perform the migration for all unverified accounts.\n");
        console.log("  node migrateExistingUsers.js --email=user@kamartaj.edu");
        console.log("      Safely verify a single specific account.\n");
        process.exit(0);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB successfully.\n");

        let query = {};
        if (targetEmail) {
            query = { email: targetEmail };
        } else {
            // Find users who are unverified or missing the emailVerified flag
            query = {
                $or: [
                    { emailVerified: { $exists: false } },
                    { emailVerified: false },
                    { emailVerified: null }
                ]
            };
        }

        const candidates = await User.find(query, "name email role emailVerified balance totalRebates createdAt");

        console.log(`Found ${candidates.length} candidate account(s):`);
        console.log("------------------------------------------------------------------");
        candidates.forEach((user, index) => {
            console.log(
                ` ${index + 1}. [${user.role.toUpperCase()}] ${user.name} <${user.email}> ` +
                `| Balance: ₹${user.balance} | Rebates: ₹${user.totalRebates} | Current Verified: ${user.emailVerified}`
            );
        });
        console.log("------------------------------------------------------------------");

        if (candidates.length === 0) {
            console.log("\nNo accounts require migration. All existing accounts are verified.");
            return;
        }

        if (isDryRun) {
            console.log("\n[DRY RUN COMPLETE] No records were modified.");
            console.log("Run with '--confirm' to apply these verification updates.");
            return;
        }

        console.log("\nApplying verification updates...");
        let updatedCount = 0;

        for (const user of candidates) {
            await User.updateOne(
                { _id: user._id },
                { $set: { emailVerified: true } }
            );
            updatedCount += 1;
        }

        console.log(`\n Successfully updated ${updatedCount} account(s) to 'emailVerified: true'.`);
        console.log("All existing balances, bookings, and user records remain completely intact.");
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("Database connection closed.");
    }
};

runMigration();

