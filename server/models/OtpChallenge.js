const mongoose = require("mongoose");

const otpChallengeSchema = new mongoose.Schema(
    {
        // Normalized recipient college email address
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },

        // Secure bcrypt hash of the 6-digit OTP code (never stored in plain text)
        otpHash: {
            type: String,
            required: true
        },

        // Number of incorrect verification attempts (max 5 allowed)
        attempts: {
            type: Number,
            default: 0
        },

        // Timestamp of when the OTP was generated/sent (for 60s cooldown enforcement)
        lastSentAt: {
            type: Date,
            default: Date.now
        },

        // OTP expiration timestamp (5 minutes from creation).
        // MongoDB TTL index cleans expired documents automatically.
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }
        },

        // Verification state
        isVerified: {
            type: Boolean,
            default: false
        },

        verifiedAt: {
            type: Date,
            default: null
        },

        // Cryptographically secure proof token issued upon successful OTP verification
        verificationToken: {
            type: String,
            default: null,
            index: true
        },

        // Expiration for the verification token session (e.g. 15 minutes to complete registration)
        tokenExpiresAt: {
            type: Date,
            default: null
        },

        // Flag indicating whether the verification token has been consumed by registration
        consumed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Compound index for fast lookup of active challenges
otpChallengeSchema.index({ email: 1, consumed: 1 });
otpChallengeSchema.index({ email: 1, verificationToken: 1 });

const OtpChallenge = mongoose.model("OtpChallenge", otpChallengeSchema);

module.exports = OtpChallenge;

