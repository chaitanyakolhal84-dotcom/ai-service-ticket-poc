const { classifyTicket } = require("./services/classificationService");

const tests = [
    {
        title: "Password reset problem",
        description: "I cannot login. My password reset link has expired."
    },
    {
        title: "Application outage",
        description: "The application is completely down for all users."
    },
    {
        title: "Payment issue",
        description: "I paid twice and need a refund."
    }
];

for (const test of tests) {
    console.log("\nTicket:", test.title);
    console.log(
        classifyTicket(test.title, test.description)
    );
}