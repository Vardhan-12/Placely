// app.js - Creates and configures the Express application

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");             // Task 2: auth routes
const testRoutes = require("./routes/testRoutes");              // Task 3: temporary middleware test routes
const companyRoutes = require("./routes/companyRoutes");       // Task 4: company routes
const adminRoutes = require("./routes/adminRoutes");           // Task 5: admin routes
const experienceRoutes = require("./routes/experienceRoutes"); // Task 6: experience routes

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

// --- Auth Routes ---
app.use("/api/auth", authRoutes); // Task 2: signup and login

// --- Test Routes (TEMPORARY — Task 3) ---
app.use("/api/test", testRoutes);

// --- Company Routes (Task 4) ---
app.use("/api/companies", companyRoutes);

// --- Admin Routes (Task 5) ---
app.use("/api/admin", adminRoutes);

// --- Experience Routes (Task 6) ---
app.use("/api/experiences", experienceRoutes);

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
