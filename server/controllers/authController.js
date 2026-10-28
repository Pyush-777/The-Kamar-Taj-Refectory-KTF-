const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OtpChallenge = require("../models/OtpChallenge");
const { validateCollegeEmail, getApprovedDomains } = require("../utils/emailValidator");
const { sendOtpEmail } = require("../services/notificationService");

// ========================================
// GET APPROVED COLLEGE EMAIL DOMAINS
// ========================================
const getAllowedDomains = (req, res) => {
    try {
        const domains = getApprovedDomains();
        return res.status(200).json({
            success: true,
            domains
        });
    } catch (error) {
        console.error("getAllowedDomains error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve approved domains."
        });
    }
};

// ========================================
// SEND OTP TO COLLEGE EMAIL
// ========================================
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "A valid college email address is required."
            });
        }

        // 1. Validate email format and exact college domain match
        const validation = validateCollegeEmail(email);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                code: "INVALID_COLLEGE_EMAIL",
                message: validation.message
            });
        }

        const normalizedEmail = validation.normalizedEmail;

        // 2. Prevent duplicate registrations: Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                code: "ACCOUNT_EXISTS",
                message: "An account with this college email already exists. Please sign in."
            });
        }

        // 3. Check for 60-second resend cooldown against active challenge in DB
        const existingChallenge = await OtpChallenge.findOne({
            email: normalizedEmail,
            consumed: false
        }).sort({ createdAt: -1 });

        if (existingChallenge && existingChallenge.lastSentAt) {
            const elapsed = Date.now() - new Date(existingChallenge.lastSentAt).getTime();
            const COOLDOWN_MS = 60 * 1000;

            if (elapsed < COOLDOWN_MS) {
                const waitSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
                res.setHeader("Retry-After", waitSeconds);
                return res.status(429).json({
                    success: false,
                    code: "COOLDOWN_ACTIVE",
                    message: `Please wait ${waitSeconds} second(s) before requesting another verification code.`,
                    retryAfter: waitSeconds
                });
            }
        }

        // 4. Generate cryptographically secure 6-digit random OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // 5. Hash OTP securely using bcrypt (never store plain OTP in MongoDB)
        const otpHash = await bcrypt.hash(otp, 10);

        // 6. Requesting a new OTP must invalidate any previous challenges for this email
        await OtpChallenge.deleteMany({ email: normalizedEmail });

        // 7. Store challenge with 5-minute expiration
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const challenge = await OtpChallenge.create({
            email: normalizedEmail,
            otpHash,
            attempts: 0,
            lastSentAt: new Date(),
            expiresAt,
            isVerified: false,
            consumed: false
        });

        // 8. Deliver OTP to the student's exact college email address
        try {
            await sendOtpEmail({
                toEmail: normalizedEmail,
                otp
            });
        } catch (mailError) {
            // Roll back challenge if delivery fails
            await OtpChallenge.deleteOne({ _id: challenge._id });
            console.error("sendOtp delivery failed:", mailError.message);
            return res.status(500).json({
                success: false,
                code: "EMAIL_DELIVERY_FAILED",
                message: "Failed to deliver verification code. Please check your email address or try again later."
            });
        }

        // Never return the OTP in the API response or print it in logs
        return res.status(200).json({
            success: true,
            message: `Verification code sent to ${normalizedEmail}. It will expire in 5 minutes.`,
            cooldownSeconds: 60
        });
    } catch (error) {
        console.error("sendOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send verification code."
        });
    }
};

// ========================================
// VERIFY OTP CHALLENGE
// ========================================
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email address and verification code are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
            return res.status(400).json({
                success: false,
                code: "INVALID_FORMAT",
                message: "Verification code must be exactly 6 digits."
            });
        }

        // Find active challenge for this email
        const challenge = await OtpChallenge.findOne({
            email: normalizedEmail,
            consumed: false
        }).sort({ createdAt: -1 });

        if (!challenge) {
            return res.status(400).json({
                success: false,
                code: "NO_ACTIVE_CHALLENGE",
                message: "No active verification challenge found. Please request a new OTP."
            });
        }

        // Check if OTP has expired (5-minute expiration)
        if (challenge.expiresAt < new Date()) {
            await OtpChallenge.deleteOne({ _id: challenge._id });
            return res.status(400).json({
                success: false,
                code: "OTP_EXPIRED",
                message: "Verification code has expired. Please request a new OTP."
            });
        }

        // Check if challenge is already verified
        if (challenge.isVerified && challenge.verificationToken) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified.",
                verificationToken: challenge.verificationToken
            });
        }

        // Check maximum incorrect attempts limit (max 5 attempts)
        const MAX_ATTEMPTS = 5;
        if (challenge.attempts >= MAX_ATTEMPTS) {
            await OtpChallenge.deleteOne({ _id: challenge._id });
            return res.status(429).json({
                success: false,
                code: "TOO_MANY_ATTEMPTS",
                message: "Maximum incorrect verification attempts exceeded. Please request a new OTP."
            });
        }

        // Check whether submitted OTP matches the stored hash
        const isMatch = await bcrypt.compare(otp.trim(), challenge.otpHash);

        if (!isMatch) {
            challenge.attempts += 1;
            await challenge.save();

            const remainingAttempts = MAX_ATTEMPTS - challenge.attempts;

            if (remainingAttempts <= 0) {
                await OtpChallenge.deleteOne({ _id: challenge._id });
                return res.status(429).json({
                    success: false,
                    code: "TOO_MANY_ATTEMPTS",
                    message: "Maximum incorrect verification attempts exceeded. Please request a new OTP."
                });
            }

            return res.status(400).json({
                success: false,
                code: "INVALID_OTP",
                message: `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
            });
        }

        // OTP is valid! Generate cryptographically secure verification token proof
        const verificationToken = crypto.randomBytes(32).toString("hex");

        challenge.isVerified = true;
        challenge.verifiedAt = new Date();
        challenge.verificationToken = verificationToken;
        // Allow student 15 minutes to finish registration form
        challenge.tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await challenge.save();

        return res.status(200).json({
            success: true,
            message: "College email verified successfully.",
            verificationToken
        });
    } catch (error) {
        console.error("verifyOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify verification code."
        });
    }
};

// ========================================
// REGISTER A NEW STUDENT
// ========================================
const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            studentId,
            hostel,
            roomNumber,
            verificationToken
        } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty."
            });
        }

        // Enforce strict college email domain validation on backend
        const validation = validateCollegeEmail(email);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                code: "INVALID_COLLEGE_EMAIL",
                message: validation.message
            });
        }

        const normalizedEmail = validation.normalizedEmail;

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server authentication configuration error."
            });
        }

        // INDEPENDENT SERVER-SIDE VERIFICATION CHECK
        // Never trust a frontend flag like emailVerified: true
        if (!verificationToken || typeof verificationToken !== "string") {
            return res.status(400).json({
                success: false,
                code: "VERIFICATION_REQUIRED",
                message: "Email verification required. Please verify your college email address with OTP before registering."
            });
        }

        const challenge = await OtpChallenge.findOne({
            email: normalizedEmail,
            verificationToken,
            isVerified: true,
            consumed: false
        });

        if (!challenge) {
            return res.status(400).json({
                success: false,
                code: "INVALID_VERIFICATION_PROOF",
                message: "Invalid, expired, or already used email verification proof. Please verify your email again."
            });
        }

        if (challenge.tokenExpiresAt && challenge.tokenExpiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                code: "VERIFICATION_SESSION_EXPIRED",
                message: "Email verification session has expired. Please verify your email again."
            });
        }

        // Check if an account already exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Security requirement: Public registration CANNOT assign administrator privileges
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            studentId: studentId || `KTF-${Math.floor(1000 + Math.random() * 9000)}`,
            hostel: hostel || "Kamar-Taj Hall A",
            roomNumber: roomNumber || "204",
            role: "student", // Strictly hardcoded to "student"
            emailVerified: true // Set verified only after server-side proof validation
        });

        // Consume the verification challenge so it cannot be reused
        challenge.consumed = true;
        await challenge.save();

        // Automatically issue token on registration
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful. Welcome to The Kamar-Taj Refectory!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                balance: user.balance,
                totalRebates: user.totalRebates,
                hostel: user.hostel,
                roomNumber: user.roomNumber,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
};

// ========================================
// LOG IN AN EXISTING USER
// ========================================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Security check: Prevent unverified users from logging in
        if (user.emailVerified === false) {
            return res.status(403).json({
                success: false,
                code: "EMAIL_NOT_VERIFIED",
                message: "Your college email address has not been verified. Please complete email verification to log in."
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                balance: user.balance,
                totalRebates: user.totalRebates,
                hostel: user.hostel,
                roomNumber: user.roomNumber,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};

// ========================================
// GET CURRENT USER PROFILE
// ========================================
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                balance: user.balance,
                totalRebates: user.totalRebates,
                hostel: user.hostel,
                roomNumber: user.roomNumber,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error("getMe error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user profile."
        });
    }
};

module.exports = {
    getAllowedDomains,
    sendOtp,
    verifyOtp,
    registerUser,
    loginUser,
    getMe
};
