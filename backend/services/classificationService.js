
const CATEGORIES = {
 
  "Technical Issue": [
    "error",
    "bug",
    "crash",
    "slow",
    "not working",
    "server",
    "application",
    "website",
    "technical",
    "failed",
    "failure",
    "exception",
    "system issue",
    "unexpected behavior",
    "keeps crashing",
    "does not load",
    "loading issue",
    "connection issue",
    "timeout",
    "security breach",
    "data breach",
    "data loss",
    "system outage",
    "production down",
    "completely down"
  ],

  "Billing & Payment": [
    "bill", "billing", "payment", "paid", "refund",
    "charge", "invoice", "transaction", "money",
    "subscription", "overcharged", "double payment",
    "payment failed", "payment declined", "charged twice",
    "incorrect amount", "deduction", "receipt", "pricing"
  ],

  "Account & Login": [
    "login", "log in", "sign in", "password",
    "account", "reset", "otp", "locked",
    "authentication", "expired link", "username",
    "forgot password", "password reset", "cannot login",
    "can't login", "unable to login", "account locked",
    "verification code", "access account", "sign up"
  ],

  "Product/Service Issue": [
    "product", "service", "defective", "damaged",
    "quality", "feature", "not satisfied",
    "replacement", "malfunction", "broken item",
    "missing feature", "poor quality", "not as described",
    "stopped working", "product issue", "wrong item"
  ],

  "Delivery/Order": [
    "delivery", "order", "shipment", "shipping",
    "tracking", "courier", "package", "parcel",
    "late", "not delivered", "dispatch",
    "delayed delivery", "order status", "tracking number",
    "package missing", "wrong address", "delivery date",
    "where is my order"
  ],

  "General Query": [
    "information", "question", "help", "details",
    "inquiry", "query", "support", "how do i",
    "more information", "working hours", "contact details",
    "general question", "need assistance"
  ]
};

const PRIORITY_KEYWORDS = {
  Critical: [
    "security breach",
    "data breach",
    "data loss",
    "system outage",
    "production down",
    "completely down",
    "all users affected",
    "service unavailable for all users",
    "emergency"
  ],

  High: [
    "urgent",
    "cannot work",
    "business stopped",
    "multiple users affected",
    "unable to access",
    "serious issue",
    "major failure",
    "payment failed",
    "account locked",
    "completely blocked"
  ],

  Low: [
    "suggestion",
    "feature request",
    "minor issue",
    "when possible",
    "general information",
    "cosmetic issue",
    "enhancement request"
  ]
};

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}


function containsPhrase(text, phrase) {
  const normalizedText = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);

  if (!normalizedPhrase) {
    return false;
  }

  return (` ${normalizedText} `).includes(` ${normalizedPhrase} `);
}

function classifyTicket(title, description) {
  if (
    typeof title !== "string" ||
    typeof description !== "string"
  ) {
    throw new TypeError("Title and description must be strings.");
  }

  if (!title.trim() || !description.trim()) {
    throw new Error("Ticket title and description are required.");
  }

  const normalizedTitle = normalizeText(title);
  const normalizedDescription = normalizeText(description);
  const fullText = `${normalizedTitle} ${normalizedDescription}`.trim();

  // Score title matches more strongly than description matches.
  const scores = {};
  const categoryMatches = {};

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    let score = 0;
    const matches = [];

    for (const keyword of keywords) {
      const inTitle = containsPhrase(normalizedTitle, keyword);
      const inDescription = containsPhrase(normalizedDescription, keyword);

      if (inTitle || inDescription) {
        matches.push(keyword);

        // Count a keyword only once, even if it appears in both fields.
        score += keyword.includes(" ") ? 2 : 1;

        if (inTitle) {
          score += 1;
        }
      }
    }

    scores[category] = score;
    categoryMatches[category] = matches;
  }

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

  const bestScore = ranked[0][1];
  const secondScore = ranked[1][1];

  let category = "General Query";
  let confidence = 45;
  let ambiguous = false;

  if (bestScore > 0) {
    const tiedCategories = ranked.filter(
      ([, score]) => score === bestScore
    );

    ambiguous = tiedCategories.length > 1;
    category = ranked[0][0];

    if (ambiguous) {
      confidence = 60;
    } else {
      const scoreGap = bestScore - secondScore;

      if (scoreGap === 1) {
        confidence = 72;
      } else if (bestScore >= 5 && scoreGap >= 2) {
        confidence = 90;
      } else if (bestScore >= 3 && scoreGap >= 2) {
        confidence = 85;
      } else {
        confidence = 78;
      }
    }
  }

  // Only report keywords supporting the selected category.
  const matchedKeywords = categoryMatches[category] || [];

  // Priority: Critical > High > Low > Medium.
  let priority = "Medium";
  const priorityMatches = [];

  for (const level of ["Critical", "High", "Low"]) {
    const matches = PRIORITY_KEYWORDS[level].filter(
      keyword => containsPhrase(fullText, keyword)
    );

    if (matches.length > 0) {
      priority = level;
      priorityMatches.push(...matches);
      break;
    }
  }

  const requiresManualReview =
    bestScore === 0 || ambiguous || confidence < 70;

  const reasoning = [
    `Predicted category: ${category}.`,
    `Category score: ${bestScore}.`,
    `Matched keywords: ${
      matchedKeywords.length
        ? matchedKeywords.join(", ")
        : "No matching keywords"
    }.`,
    `Priority: ${priority}.`,
    `Priority indicators: ${
      priorityMatches.length
        ? priorityMatches.join(", ")
        : "No explicit priority indicator; defaulted to Medium"
    }.`,
    `Manual review: ${
      requiresManualReview
        ? "Recommended because classification is uncertain."
        : "Not required by the configured rules."
    }`
  ].join(" ");

  return {
    category,
    priority,
    confidence,
    requiresManualReview,
    keywords: matchedKeywords,
    reasoning,
    modelType: "Improved rule-based baseline"
  };
}

module.exports = { classifyTicket };
