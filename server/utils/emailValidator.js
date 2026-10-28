/**
 * Email validation utility for college email domain enforcement.
 * Enforces exact domain matching, normalization, and strict formatting.
 */

const getApprovedDomains = () => {
    const raw = process.env.COLLEGE_EMAIL_DOMAINS || "";
    return raw
        .split(",")
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean);
};

const normalizeEmail = (email) => {
    if (typeof email !== "string") return "";
    return email.trim().toLowerCase();
};

/**
 * Validates whether an email is a valid college email address.
 * Domain matching is exact (e.g. "student@college.ac.in.fake.com" is strictly rejected).
 *
 * @param {string} email
 * @returns {{ isValid: boolean, message?: string, normalizedEmail?: string, domain?: string }}
 */
const validateCollegeEmail = (email) => {
    const normalized = normalizeEmail(email);

    if (!normalized) {
        return {
            isValid: false,
            message: "Email address is required."
        };
    }

    // Strict RFC email validation regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(normalized)) {
        return {
            isValid: false,
            message: "Please enter a valid email address format."
        };
    }

    const parts = normalized.split("@");
    if (parts.length !== 2) {
        return {
            isValid: false,
            message: "Invalid email address structure."
        };
    }

    const domain = parts[1];
    const approvedDomains = getApprovedDomains();

    if (approvedDomains.length === 0) {
        return {
            isValid: false,
            message: "No college email domains are configured on the server. Please set COLLEGE_EMAIL_DOMAINS."
        };
    }

    // Exact domain match
    const isApproved = approvedDomains.includes(domain);
    if (!isApproved) {
        return {
            isValid: false,
            message: `Only official college email addresses (${approvedDomains.join(", ")}) are permitted. Personal email domains like Gmail, Yahoo, or Outlook are not allowed.`
        };
    }

    return {
        isValid: true,
        normalizedEmail: normalized,
        domain
    };
};

module.exports = {
    getApprovedDomains,
    normalizeEmail,
    validateCollegeEmail
};

