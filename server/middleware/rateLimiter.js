/**
 * Secure rate limiting middleware for OTP generation and verification.
 * Enforces IP-based limits, email-based cooldowns, and request limits
 * without external dependencies.
 */

// In-memory buckets for rate limiting
const ipBuckets = new Map();
const emailBuckets = new Map();

/**
 * Clean up expired entries periodically to prevent memory leaks
 */
setInterval(() => {
    const now = Date.now();

    for (const [key, record] of ipBuckets.entries()) {
        if (record.resetTime <= now) {
            ipBuckets.delete(key);
        }
    }

    for (const [key, record] of emailBuckets.entries()) {
        if (record.resetTime <= now) {
            emailBuckets.delete(key);
        }
    }
}, 60000);

/**
 * Creates an IP-based rate limiter middleware
 *
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests permitted within windowMs
 * @param {string} options.message - Error message returned when rate limit is exceeded
 */
const createIpRateLimiter = ({ windowMs, max, message }) => {
    return (req, res, next) => {
        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.ip ||
            req.socket?.remoteAddress ||
            "unknown";

        const now = Date.now();
        let record = ipBuckets.get(ip);

        if (!record || record.resetTime <= now) {
            record = {
                count: 1,
                resetTime: now + windowMs
            };
            ipBuckets.set(ip, record);
        } else {
            record.count += 1;
        }

        const remaining = Math.max(0, max - record.count);
        const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader("X-RateLimit-Remaining", remaining);

        if (record.count > max) {
            res.setHeader("Retry-After", retryAfterSeconds);
            return res.status(429).json({
                success: false,
                code: "RATE_LIMITED",
                message: message || "Too many requests from this IP. Please try again later.",
                retryAfter: retryAfterSeconds
            });
        }

        next();
    };
};

/**
 * Middleware that enforces:
 * 1. 60-second cooldown between successive OTP requests for the same email
 * 2. Max 5 OTP requests per hour for the same email
 */
const emailOtpRateLimiter = (req, res, next) => {
    const rawEmail = req.body?.email;
    if (!rawEmail || typeof rawEmail !== "string") {
        return next();
    }

    const email = rawEmail.trim().toLowerCase();
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown

    let record = emailBuckets.get(email);

    if (!record || record.resetTime <= now) {
        record = {
            count: 0,
            lastRequestTime: 0,
            resetTime: now + ONE_HOUR
        };
        emailBuckets.set(email, record);
    }

    // 1. Enforce 60-second cooldown
    if (record.lastRequestTime && now - record.lastRequestTime < COOLDOWN_MS) {
        const remainingCooldown = Math.ceil(
            (COOLDOWN_MS - (now - record.lastRequestTime)) / 1000
        );
        res.setHeader("Retry-After", remainingCooldown);
        return res.status(429).json({
            success: false,
            code: "COOLDOWN_ACTIVE",
            message: `Please wait ${remainingCooldown} second(s) before requesting another verification code.`,
            retryAfter: remainingCooldown
        });
    }

    // 2. Enforce max 5 OTP requests per hour
    const MAX_HOURLY_REQUESTS = 5;
    if (record.count >= MAX_HOURLY_REQUESTS) {
        const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader("Retry-After", retryAfterSeconds);
        return res.status(429).json({
            success: false,
            code: "OTP_HOURLY_LIMIT_EXCEEDED",
            message: `Hourly verification limit reached for this email. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
            retryAfter: retryAfterSeconds
        });
    }

    // Record this attempt on response finish if successful
    const originalEnd = res.end;
    res.end = function (...args) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            record.count += 1;
            record.lastRequestTime = Date.now();
        }
        originalEnd.apply(this, args);
    };

    next();
};

/**
 * Resets memory state (used in automated test suites)
 */
const resetRateLimiters = () => {
    ipBuckets.clear();
    emailBuckets.clear();
};

module.exports = {
    createIpRateLimiter,
    emailOtpRateLimiter,
    resetRateLimiters
};

