
const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");

// Keep the classifier import path from your existing controller.
const { classifyTicket } = require("../services/classificationService");

const CATEGORIES = [
  "Technical Issue",
  "Billing & Payment",
  "Account & Login",
  "Product/Service Issue",
  "Delivery/Order",
  "General Query",
];

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["New", "In Progress", "Resolved"];

function isAdmin(req) {
  return req.user?.role === "admin";
}

function ticketOwnerFilter(req) {
  return isAdmin(req) ? {} : { owner: req.user.id };
}

// CREATE TICKET
exports.createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ticket title and description are required.",
      });
    }

    const prediction = await classifyTicket(
      title.trim(),
      description.trim()
    );

    const category = prediction.category || "General Query";
    const priority = prediction.priority || "Medium";
    const confidence = Number(prediction.confidence ?? 0);

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description.trim(),
      owner: req.user.id,
      customerName: req.user.name || "",
      customerEmail: req.user.email || "",
      category,
      priority,
      aiCategory: category,
      aiPriority: priority,
      confidence,
      keywords: prediction.keywords || [],
      aiReasoning:
        prediction.reasoning ||
        prediction.aiReasoning ||
        "Classification completed.",
      requiresManualReview:
        prediction.requiresManualReview ?? confidence < 70,
      status: "New",
      deletedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created and classified successfully!",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create ticket.",
    });
  }
};

// GET ACTIVE TICKETS OR DELETED TICKETS
exports.getTickets = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      priority = "",
      status = "",
      includeDeleted = "false",
    } = req.query;

    const filter = { ...ticketOwnerFilter(req) };

    if (includeDeleted === "true") {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: "Only an administrator can view deleted tickets.",
        });
      }

      filter.deletedAt = { $ne: null };
    } else {
      filter.deletedAt = null;
    }

    if (CATEGORIES.includes(category)) filter.category = category;
    if (PRIORITIES.includes(priority)) filter.priority = priority;
    if (STATUSES.includes(status)) filter.status = status;

    if (search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
      ];
    }

    const tickets = await Ticket.find(filter).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load tickets.",
    });
  }
};

// GET SINGLE TICKET
exports.getTicketById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      ...ticketOwnerFilter(req),
      deletedAt: null,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    return res.json({ success: true, ticket });
  } catch (error) {
    console.error("Get ticket details error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load ticket details.",
    });
  }
};

// UPDATE TICKET / MANUAL CLASSIFICATION OVERRIDE
exports.updateTicket = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only an administrator can update tickets.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const { category, priority, status } = req.body;
    const updates = {};

    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket category.",
        });
      }
      updates.category = category;
      updates.categoryOverridden = true;
    }

    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket priority.",
        });
      }
      updates.priority = priority;
      updates.priorityOverridden = true;
    }

    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket status.",
        });
      }
      updates.status = status;
    }

    if (category === undefined &&
      priority === undefined &&
      status === undefined) {
      return res.status(400).json({
        success: false,
        message: "No valid updates were provided.",
      });
    }

    if (category !== undefined || priority !== undefined) {
      updates.requiresManualReview = false;
    }

    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        deletedAt: null,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    return res.json({
      success: true,
      message: "Ticket updated successfully.",
      ticket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Ticket update failed.",
    });
  }
};

// DASHBOARD STATISTICS — ACTIVE TICKETS ONLY
exports.getDashboardStats = async (req, res) => {
  try {
    const activeFilter = { deletedAt: null };

    const [
      totalTickets,
      newTickets,
      inProgressTickets,
      resolvedTickets,
      highCriticalTickets,
      reviewTickets,
    ] = await Promise.all([
      Ticket.countDocuments(activeFilter),
      Ticket.countDocuments({ ...activeFilter, status: "New" }),
      Ticket.countDocuments({
        ...activeFilter,
        status: "In Progress",
      }),
      Ticket.countDocuments({
        ...activeFilter,
        status: "Resolved",
      }),
      Ticket.countDocuments({
        ...activeFilter,
        priority: { $in: ["High", "Critical"] },
      }),
      Ticket.countDocuments({
        ...activeFilter,
        requiresManualReview: true,
      }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalTickets,
        newTickets,
        inProgressTickets,
        resolvedTickets,
        highCriticalTickets,
        reviewTickets,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics.",
    });
  }
};

// SOFT DELETE — MOVE TICKET TO RECYCLE BIN
exports.deleteTicket = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only an administrator can delete tickets.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Active ticket not found.",
      });
    }

    return res.json({
      success: true,
      message: "Ticket moved to Deleted Tickets.",
      ticket,
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete ticket.",
    });
  }
};

// RESTORE FROM RECYCLE BIN
exports.restoreTicket = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only an administrator can restore tickets.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        deletedAt: { $ne: null },
      },
      { $set: { deletedAt: null } },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Deleted ticket not found.",
      });
    }

    return res.json({
      success: true,
      message: "Ticket restored successfully.",
      ticket,
    });
  } catch (error) {
    console.error("Restore ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to restore ticket.",
    });
  }
};

// PERMANENTLY DELETE FROM RECYCLE BIN
exports.permanentlyDeleteTicket = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only an administrator can permanently delete tickets.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findOneAndDelete({
      _id: req.params.id,
      deletedAt: { $ne: null },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Deleted ticket not found.",
      });
    }

    return res.json({
      success: true,
      message: "Ticket permanently deleted.",
    });
  } catch (error) {
    console.error("Permanent delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to permanently delete ticket.",
    });
  }
};
