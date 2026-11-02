// app.js - Creates and configures the Express application

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");

const app = express();

// --- Global Middleware ---
app.use(cors());               // Allow cross-origin requests (needed when React frontend calls this API)
app.use(express.json());       // Parse incoming JSON request bodies
app.use(morgan("dev"));        // Log every HTTP request to the console in a readable format

// --- Routes ---

// Health check route - used to verify the server is up and running
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Placely API running",
  });
});

// --- 404 Handler ---
// Catches any request that didn't match a route above
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Central Error Handler ---
// Must be registered AFTER routes
app.use(errorHandler);

module.exports = app;
