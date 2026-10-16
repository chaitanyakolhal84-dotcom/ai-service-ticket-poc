
// AI-Based Service Ticket Categorization
// Rule-based classification engine for MERN PoC

const CATEGORIES = {
    "Technical Issue": [
        "error", "bug", "crash", "slow", "not working",
        "server", "application", "website", "technical",
        "failed", "failure", "exception", "system issue"
    ],

    "Billing & Payment": [
        "bill", "billing", "payment", "paid", "refund",
        "charge", "invoice", "transaction", "money",
        "subscription", "overcharged", "double payment"
    ],

    "Account & Login": [
        "login", "log in", "sign in", "password",
        "account", "reset", "otp", "locked",
        "authentication", "expired link", "username"
    ],

    "Product/Service Issue": [
        "product", "service", "defective", "damaged",
        "quality", "feature", "not satisfied",
        "replacement", "malfunction"
    ],

    "Delivery/Order": [
        "delivery", "order", "shipment", "shipping",
        "tracking", "courier", "package", "parcel",
        "late", "not delivered", "dispatch"
    ],

    "General Query": [
        "information", "question", "help", "details",
        "inquiry", "query", "support"
    ]
};

const PRIORITY_KEYWORDS = {
    Critical: [
        "completely down",
        "all users",
        "security breach",
        "data breach",
        "data loss",
        "system outage",
        "production down",
        "emergency"
    ],

    High: [
        "urgent",
        "cannot work",
        "business stopped",
        "multiple users",
        "unable to access",
        "serious issue",
        "major failure"
    ],

    Low: [
        "suggestion",
        "feature request",
        "minor issue",
        "when possible",
        "general information"
    ]
};

function classifyTicket(title, description) {
    if (typeof title !== "string" || typeof description !== "string") {
        throw new TypeError("Title and description must be strings.");
    }

    if (!title.trim() || !description.trim()) {
        throw new Error("Ticket title and description are required.");
    }

    const text = `${title} ${description} `
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    // Category scoring
    const scores = {};

    for (const category of Object.keys(CATEGORIES)) {
        scores[category] = 0;

        for (const keyword of CATEGORIES[category]) {
            if (text.includes(keyword)) {
                scores[category] += keyword.includes(" ") ? 2 : 1;
            }
        }
    }

    const ranked = Object.entries(scores)
        .sort((a, b) => b[1] - a[1]);

    const bestScore = ranked[0][1];
    const secondScore = ranked[1][1];

    let category = "General Query";
    let confidence = 55;

    if (bestScore > 0) {
        category = ranked[0][0];

        if (bestScore === secondScore) {
            confidence = 65;
        } else if (bestScore >= 3) {
            confidence = 92;
        } else {
            confidence = 82;
        }
    }

    // Matching keywords for explanation
    const matchedKeywords = [];

    for (const keywords of Object.values(CATEGORIES)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                matchedKeywords.push(keyword);
            }
        }
    }

    const uniqueKeywords = [...new Set(matchedKeywords)];

    // Priority detection: Critical > High > Low > Medium
    let priority = "Medium";

    if (
        PRIORITY_KEYWORDS.Critical.some(keyword => text.includes(keyword))
    ) {
        priority = "Critical";
    } else if (
        PRIORITY_KEYWORDS.High.some(keyword => text.includes(keyword))
    ) {
        priority = "High";
    } else if (
        PRIORITY_KEYWORDS.Low.some(keyword => text.includes(keyword))
    ) {
        priority = "Low";
    }

    // Confidence below 70 requires agent review
    const requiresManualReview = confidence < 70;

    const reasoning =
        `Predicted category: ${category}.` +
        `Matched keywords: ${uniqueKeywords.length > 0
            ? uniqueKeywords.join(", ")
            : "No matching keywords"
        }.` +
        `Priority: ${priority}, based on configured priority rules.`;

    return {
        category,
        priority,
        confidence,
        requiresManualReview,
        keywords: uniqueKeywords,
        reasoning,
        modelType: "Rule-based baseline"
    };
}

// Correct CommonJS export
module.exports = { classifyTicket };
