const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");

// Optional transporter configured via environment variables
let transporter = null;

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

            if (transporter) {
                await transporter.sendMail({
                    from: `"Kamar-Taj Refectory" <${process.env.SMTP_FROM || "refectory@kamartaj.edu"}>`,
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
    sendNotification
};
