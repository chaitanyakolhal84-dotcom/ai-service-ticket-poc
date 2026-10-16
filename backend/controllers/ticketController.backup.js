const Ticket = require("../models/Ticket");
const { classifyTicket } = require("../services/classificationService");

// Create ticket with automatic classification
exports.createTicket = async (req, res) => {
try {
const {
title,
description,
customerName,
customerEmail
} = req.body;

if (
  !title?.trim() ||
  !description?.trim() ||
  !customerName?.trim() ||
  !customerEmail?.trim()
) {
  return res.status(400).json({
    success: false,
    message: "Title, description, customer name and email are required."
  });
}

const prediction = classifyTicket(title, description);

const ticket = await Ticket.create({
  title: title.trim(),
  description: description.trim(),
  customerName: customerName.trim(),
  customerEmail: customerEmail.trim().toLowerCase(),

  category: prediction.category,
  priority: prediction.priority,

  aiCategory: prediction.category,
  aiPriority: prediction.priority,

  confidence: prediction.confidence,
  keywords: prediction.keywords || [],
  aiReasoning: prediction.reasoning || "",
  requiresManualReview: prediction.confidence < 70,

  status: "New"
});

return res.status(201).json({
  success: true,
  message: "Ticket created and classified successfully.",
  ticket
});


} catch (error) {
console.error("Create ticket error:", error);


return res.status(500).json({
  success: false,
  message: "Unable to create ticket."
});


}
};

// Get all tickets with search and filters
exports.getTickets = async (req, res) => {
try {
const { search, category, priority, status } = req.query;


const filter = {};

if (category) {
  filter.category = category;
}

if (priority) {
  filter.priority = priority;
}

if (status) {
  filter.status = status;
}

if (search && search.trim().length > 0) {
  const searchText = search.trim();

  filter.$or = [
    { title: { $regex: searchText, $options: "i" } },
    { description: { $regex: searchText, $options: "i" } },
    { customerName: { $regex: searchText, $options: "i" } },
    { customerEmail: { $regex: searchText, $options: "i" } }
  ];
}

const tickets = await Ticket.find(filter).sort({ createdAt: -1 });

return res.status(200).json({
  success: true,
  count: tickets.length,
  tickets: tickets
});

} catch (error) {
console.error("Get tickets error:", error);


return res.status(500).json({
  success: false,
  message: "Unable to fetch tickets."
});


}
};


// Get ticket details
exports.getTicketById = async (req, res) => {
try {
const ticket = await Ticket.findById(req.params.id);


if (!ticket) {
  return res.status(404).json({
    success: false,
    message: "Ticket not found."
  });
}

return res.json({ success: true, ticket });


} catch (error) {
return res.status(400).json({
success: false,
message: "Invalid ticket ID."
});
}
};

// Update category, priority or status
exports.updateTicket = async (req, res) => {
try {
const { category, priority, status } = req.body;

const updates = {};
const allowedCategories = [
  "Technical Issue",
  "Billing & Payment",
  "Account & Login",
  "Product/Service Issue",
  "Delivery/Order",
  "General Query"
];
const allowedPriorities = ["Low", "Medium", "High", "Critical"];
const allowedStatuses = ["New", "In Progress", "Resolved"];

if (
  category === undefined &&
  priority === undefined &&
  status === undefined
) {
  return res.status(400).json({
    success: false,
    message: "Provide category, priority or status to update."
  });
}

if (category !== undefined) {
  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category."
    });
  }
  updates.category = category;
}

if (priority !== undefined) {
  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: "Invalid priority."
    });
  }
  updates.priority = priority;
}

if (status !== undefined) {
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status."
    });
  }
  updates.status = status;
}

if (category !== undefined || priority !== undefined) {
  updates.manuallyReviewed = true;
  updates.requiresManualReview = false;
}

const ticket = await Ticket.findByIdAndUpdate(
  req.params.id,
  { $set: updates },
  { new: true, runValidators: true }
);

if (!ticket) {
  return res.status(404).json({
    success: false,
    message: "Ticket not found."
  });
}

return res.json({
  success: true,
  message: "Ticket updated successfully.",
  ticket
});


} catch (error) {
console.error("Update ticket error:", error);


return res.status(400).json({
  success: false,
  message: "Unable to update ticket."
});


}
};

// Dashboard summary
exports.getDashboardStats = async (req, res) => {
try {
const [
totalTickets,
newTickets,
inProgressTickets,
resolvedTickets,
highCriticalTickets,
reviewTickets
] = await Promise.all([
Ticket.countDocuments(),
Ticket.countDocuments({ status: "New" }),
Ticket.countDocuments({ status: "In Progress" }),
Ticket.countDocuments({ status: "Resolved" }),
Ticket.countDocuments({ priority: { $in: ["High", "Critical"] } }),
Ticket.countDocuments({ requiresManualReview: true })
]);


return res.json({
  success: true,
  stats: {
    totalTickets,
    newTickets,
    inProgressTickets,
    resolvedTickets,
    highCriticalTickets,
    reviewTickets
  }
});


} catch (error) {
console.error("Dashboard stats error:", error);

return res.status(500).json({
  success: false,
  message: "Unable to fetch dashboard statistics."
});


}
};
