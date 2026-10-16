const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const ticketRoutes = require("./routes/ticketRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// Health check route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Service Ticket POC Backend is working!",
        database:
            mongoose.connection.readyState === 1
                ? "Connected"
                : "Disconnected"
    });
});

// Ticket API routes
app.use("/api/tickets", ticketRoutes);

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

// Connect MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env file.");
        }


        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log("Ticket API: http://localhost:5000/api/tickets");
        });


    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
