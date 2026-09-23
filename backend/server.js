const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { connectdb } = require("./database/mongo");
const pool = require("./database/pg");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();

// ==================== APP SETUP ====================

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== GLOBAL MIDDLEWARE ====================

// Enable CORS for frontend clients
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Parse JSON and URL-encoded request bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ==================== ROUTES ====================

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const siteRoutes = require("./routes/siteRoutes");
const { getNlpServiceUrl } = require("./services/nlpService");

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sites", siteRoutes);

// ==================== HOME & HEALTH ROUTES ====================

app.get("/", (req, res) => {
  res.status(200).json({
    name: "SIFguard API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      auth: "/api/auth",
      documents: "/api/documents",
      sites: "/api/sites",
      analytics: "/api/analytics",
    },
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Database connectivity check
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    return res.status(200).json({
      message: "PostgreSQL connected",
      time: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "PostgreSQL connection failed",
      error: error.message,
    });
  }
});

// ==================== UPLOAD ERROR HANDLER ====================

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: 'Unexpected file field. Use form-data key "file" or "document".',
      });
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File is too large. Maximum size is 5 MB.",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }

  if (
    error &&
    typeof error.message === "string" &&
    error.message.includes("Only PDF, DOC, DOCX and TXT files are allowed.")
  ) {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
});

// ==================== 404 HANDLER ====================

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==================== GENERIC ERROR HANDLER ====================

app.use((error, req, res, next) => {
  console.error("Unhandled backend error:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    message: error.message || "Internal server error",
  });
});

// ==================== START SERVER ====================

const startServer = async () => {
  try {
    // 1. Attempt MongoDB connection
    await connectdb();

    // 2. Attempt PostgreSQL table setup
    await pool.initializeAuthTable();

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`SIFguard Backend Server running on port ${PORT}`);
      console.log(`Local:   http://localhost:${PORT}`);
      console.log(`NLP URL: ${getNlpServiceUrl()}`);
      console.log(`========================================`);
    });

    return server;
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
