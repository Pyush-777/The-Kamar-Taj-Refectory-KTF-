const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");

// Active nodemailer transporter
let transporter = null;

const getTransporter = () => {
    if (transporter) {
        return transporter;
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === "true",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            console.log("Nodemailer SMTP transport initialized.");
        } catch (err) {
            console.warn("Failed to initialize SMTP transporter:", err.message);
        }
    }

    return transporter;
};

// Allows injecting a mock/test transporter during automated testing
const setCustomTransporter = (customTransporter) => {
    transporter = customTransporter;
};

/**
 * Sends a 6-digit college email OTP verification code.
 * Adheres strictly to security requirements:
 * - OTP is never logged to the console or server logs
 * - Recipient is strictly the college email address
 * - Email contains expiration time (5 minutes) and security warning
 *
 * @param {object} params
 * @param {string} params.toEmail
 * @param {string} params.otp
 * @returns {Promise<boolean>}
 */
const sendOtpEmail = async ({ toEmail, otp }) => {
    const fromAddress =
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        "refectory@kamartaj.edu";

    const subject = "Your Kamar-Taj Refectory Verification Code";

    const textContent =
        `Hello,\n\n` +
        `Your verification code for The Kamar-Taj Refectory is: ${otp}\n\n` +
        `This code will expire in 5 minutes.\n` +
        `For your security, do not share this code with anyone.\n\n` +
        `The Kamar-Taj Refectory Team`;

    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #1e2238; border-radius: 12px; background-color: #0b0e1c; color: #f1f5f9;">
            <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 10px; color: #ffffff; text-align: center; margin-bottom: 24px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">The Kamar-Taj Refectory</h1>
                <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; letter-spacing: 0.5px;">CAMPUS MESS MANAGEMENT PORTAL</p>
            </div>

            <div style="padding: 0 10px;">
                <h2 style="color: #f1f5f9; font-size: 18px; margin-top: 0; font-weight: 600;">Email Verification Required</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
                    Please enter the one-time verification code below to verify your college email address and complete your student dining registration:
                </p>

                <div style="background: #13172e; border: 2px dashed #6366f1; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #a5b4fc; display: block; margin-bottom: 8px; font-weight: 600;">One-Time Passcode</span>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #ffffff; padding-left: 10px;">
                        ${otp}
                    </div>
                </div>

                <div style="background-color: #1e1b4b; border-left: 4px solid #818cf8; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #c7d2fe; line-height: 1.5;">
                        ⏱️ <strong>Validity:</strong> This code expires in <strong>5 minutes</strong>.
                    </p>
                </div>

                <div style="background-color: #3b0716; border-left: 4px solid #f43f5e; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #fecdd3; line-height: 1.5;">
                        🔒 <strong>Security Warning:</strong> Never share this code with anyone. Kamar-Taj administrators will never ask for your verification code.
                    </p>
                </div>

                <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
                    If you did not request this verification code, please ignore this email or notify the campus dining office immediately.
                </p>
            </div>

            <hr style="border: none; border-top: 1px solid #1e2238; margin: 24px 0 16px;" />
            <p style="font-size: 11px; color: #475569; text-align: center; margin: 0;">
                Automated security notification from The Kamar-Taj Refectory Dining Management System.
            </p>
        </div>
    `;

    const activeTransporter = getTransporter();

    if (activeTransporter) {
        try {
            await activeTransporter.sendMail({
                from: `"Kamar-Taj Refectory" <${fromAddress}>`,
                to: toEmail,
                subject,
                text: textContent,
                html: htmlContent
            });
            // Note: Never log the OTP code itself.
            console.log(`[Email Sent] Verification email delivered to ${toEmail}`);
            return true;
        } catch (error) {
            console.error(`[Email Delivery Failed] Recipient: ${toEmail} | Error: ${error.message}`);
            throw new Error(`Email delivery failed: ${error.message}`);
        }
    } else {
        // Safe simulation when SMTP is not configured in local environment
        console.log(`[Notification Sim] Verification OTP sent to college email: ${toEmail} (SMTP not configured)`);
        return true;
    }
};

/**
 * Dispatch notification:
 * 1. Creates an in-app database notification for the user.
 * 2. Attempts to send an email via nodemailer (or logs formatted receipt to console if SMTP not configured).
 */
const sendNotification = async ({
    userId,
    toEmail,
    userName = "Student",
    subject,
    title,
    message,
    type = "system",
    metadata = {}
}) => {
    try {
        // 1. Create in-app notification record if userId provided
        let notificationDoc = null;
        if (userId) {
            notificationDoc = await Notification.create({
                user: userId,
                title: title || subject,
                message,
                type,
                metadata
            });
        }

        // 2. Send email notification if recipient email is present
        if (toEmail) {
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
                    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 16px 20px; border-radius: 6px; color: #ffffff; margin-bottom: 20px;">
                        <h2 style="margin: 0; font-size: 20px; letter-spacing: -0.5px;">The Kamar-Taj Refectory</h2>
                        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Smart Campus Mess Management System</p>
                    </div>

                    <h3 style="color: #0f172a; margin-top: 0;">${title || subject}</h3>
                    <p>Hello <strong>${userName}</strong>,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #334155;">${message}</p>

                    ${metadata.bookingCode ? `
                        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                            <p style="margin: 0; font-size: 13px; color: #64748b;">Booking Reference Code:</p>
                            <p style="margin: 4px 0 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #0f172a;">${metadata.bookingCode}</p>
                        </div>
                    ` : ""}

                    ${metadata.rebateCredited ? `
                        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                            <p style="margin: 0; font-size: 13px; color: #166534;">Rebate Credited to Dining Wallet:</p>
                            <p style="margin: 4px 0 0; font-size: 16px; font-weight: bold; color: #15803d;">₹${metadata.rebateCredited}</p>
                        </div>
                    ` : ""}

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                        This is an automated notification from The Kamar-Taj Refectory dining portal.
                    </p>
                </div>
            `;

            const activeTransporter = getTransporter();

            if (activeTransporter) {
                await activeTransporter.sendMail({
                    from: `"Kamar-Taj Refectory" <${process.env.SMTP_FROM || process.env.EMAIL_FROM || "refectory@kamartaj.edu"}>`,
                    to: toEmail,
                    subject: subject || title,
                    text: message,
                    html: htmlContent
                });
                console.log(`[Email Sent] To: ${toEmail} | Subject: ${subject}`);
            } else {
                console.log(`[Notification Sim] To: ${toEmail} | Subject: ${subject} | Message: ${message}`);
            }
        }

        return notificationDoc;
    } catch (error) {
        console.error("sendNotification error:", error.message);
        return null;
    }
};

module.exports = {
    getTransporter,
    setCustomTransporter,
    sendOtpEmail,
    sendNotification
};
