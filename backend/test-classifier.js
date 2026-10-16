
const assert = require("node:assert/strict");
const { classifyTicket } = require("./services/classificationService");

const tests = [
  {
    name: "Technical Issue",
    title: "Website keeps crashing",
    description: "The application crashes whenever I open it.",
    category: "Technical Issue"
  },
  {
    name: "Billing & Payment",
    title: "Refund for incorrect invoice",
    description: "I paid the wrong amount and need a refund.",
    category: "Billing & Payment"
  },
  {
    name: "Account & Login",
    title: "Password reset issue",
    description: "I cannot login because my password reset link expired.",
    category: "Account & Login"
  },
  {
    name: "Product/Service Issue",
    title: "Damaged product received",
    description: "The product is broken and its quality is poor.",
    category: "Product/Service Issue"
  },
  {
    name: "Delivery/Order",
    title: "Where is my order?",
    description: "My package has not been delivered yet.",
    category: "Delivery/Order"
  },
  {
    name: "General Query",
    title: "Need information",
    description: "Please provide support contact details and working hours.",
    category: "General Query"
  },
  {
     name: "Critical Priority",
  title: "Security breach detected",
  description: "We have detected a security breach in the system.",
  category: "Technical Issue",
  priority: "Critical"

  },
  {
    name: "High Priority",
    title: "Urgent website failure",
    description: "This is an urgent issue and we cannot work.",
    category: "Technical Issue",
    priority: "High"
  },
  {
    name: "Low Priority",
  title: "Feature request",
  description: "Please consider this suggestion when possible.",
  category: "Product/Service Issue",
  priority: "Low"

  },
  {
    name: "Unknown issue",
  title: "Something happened",
  description: "Please look into this matter.",
  category: "General Query",
  review: true

  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    const result = classifyTicket(test.title, test.description);

    assert.equal(result.category, test.category);

    if (test.priority) {
      assert.equal(result.priority, test.priority);
    }

    if (test.review !== undefined) {
      assert.equal(result.requiresManualReview, test.review);
    }

    assert.ok(result.confidence >= 0 && result.confidence <= 100);
    assert.ok(Array.isArray(result.keywords));

    passed++;

    console.log(`PASS: ${test.name}`);
    console.log(
      `  Category: ${result.category} | Priority: ${result.priority} | Confidence: ${result.confidence}`
    );
  } catch (error) {
    failed++;
    console.log(`FAIL: ${test.name}`);
    console.log(`  ${error.message}`);
  }
}

console.log("\n========== TEST SUMMARY ==========");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${tests.length}`);

if (failed > 0) {
  process.exitCode = 1;
}