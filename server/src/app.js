// app.js - Creates and configures the Express application

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");             // Task 2: auth routes
const companyRoutes = require("./routes/companyRoutes");       // Task 4: company routes
const adminRoutes = require("./routes/adminRoutes");           // Task 5: admin routes
const experienceRoutes = require("./routes/experienceRoutes"); // Task 6: experience routes
const qaRoutes = require("./routes/qaRoutes");                 // Task 7: Q&A routes
const bookmarkRoutes = require("./routes/bookmarkRoutes");     // Task 8: bookmark routes
const userRoutes = require("./routes/userRoutes");             // Task 8: public user profile routes
const aiRoutes = require("./routes/aiRoutes");                 // Task 15: AI summary routes
const notificationRoutes = require("./routes/notificationRoutes"); // Task 19: Notifications

const app = express();

// --- Security & Global Middleware ---
app.use(helmet());

// Allowed CORS origins: CLIENT_URL (comma-separated) + http://localhost:5173
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "100kb" })); // Parse incoming JSON request bodies up to 100kb
app.use(morgan("dev"));                    // Log every HTTP request to the console in a readable format

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

// --- Company Routes (Task 4) ---
app.use("/api/companies", companyRoutes);

// --- Admin Routes (Task 5 & 8) ---
app.use("/api/admin", adminRoutes);

// --- Experience Routes (Task 6) ---
app.use("/api/experiences", experienceRoutes);

// --- Q&A Routes (Task 7) ---
app.use("/api/qa", qaRoutes);

// --- Bookmark Routes (Task 8) ---
app.use("/api/bookmarks", bookmarkRoutes);

// --- Public User Routes (Task 8) ---
app.use("/api/users", userRoutes);

// --- AI Routes (Task 15) ---
app.use("/api/ai", aiRoutes);

// --- Notification Routes (Task 19) ---
app.use("/api/notifications", notificationRoutes);

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
