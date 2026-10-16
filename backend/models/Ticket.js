
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Ticket title is required"],
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: [true, "Ticket description is required"],
      trim: true,
      maxlength: 5000
    },

    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true
    },

    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    category: {
      type: String,
      enum: [
        "Technical Issue",
        "Billing & Payment",
        "Account & Login",
        "Product/Service Issue",
        "Delivery/Order",
        "General Query"
      ],
      required: true
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true
    },

    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },

    aiReasoning: {
      type: String,
      default: ""
    },

    keywords: {
      type: [String],
      default: []
    },

    requiresManualReview: {
      type: Boolean,
      default: false
    },

    aiCategory: {
      type: String,
      required: true
    },

    aiPriority: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["New", "In Progress", "Resolved"],
      default: "New"
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    categoryOverridden: {
      type: Boolean,
      default: false
    },

    priorityOverridden: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);

