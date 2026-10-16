
const express = require("express");
const router = express.Router();

const {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    getDashboardStats,
    deleteTicket,
    restoreTicket,
    permanentlyDeleteTicket,
} = require("../controllers/ticketController");

const {
    protect,
    authorizeRoles,
} = require("../middleware/authMiddleware");

// All routes require authentication.
router.use(protect);

// Create a new ticket.
router.post("/", createTicket);

// Dashboard statistics.
router.get(
    "/stats",
    authorizeRoles("admin"),
    getDashboardStats
);

// Active tickets or admin-only deleted tickets.
router.get("/", getTickets);

// Soft delete: move ticket to Deleted Tickets.
router.delete(
    "/:id",
    authorizeRoles("admin"),
    deleteTicket
);

// Restore a ticket from Deleted Tickets.
router.patch(
    "/:id/restore",
    authorizeRoles("admin"),
    restoreTicket
);

// Permanently delete a ticket from Deleted Tickets.
router.delete(
    "/:id/permanent",
    authorizeRoles("admin"),
    permanentlyDeleteTicket
);

// Update ticket classification or status.
router.patch(
    "/:id",
    authorizeRoles("admin"),
    updateTicket
);

// Get ticket details.
router.get("/:id", getTicketById);

module.exports = router;
