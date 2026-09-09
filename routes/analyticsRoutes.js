
// routes/analyticsRoutes.js

const express = require("express");

const {
  getAnalytics,
  getOverview,
  getPatterns,
  getTrends,
  getHighRiskPatterns,
  getEmergingTrends,
} = require("../controllers/analyticsController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Analytics Routes
|--------------------------------------------------------------------------
*/

// Complete analytics dashboard data
router.get("/", getAnalytics);

// Overall statistics
router.get("/overview", getOverview);

// Hazard/activity/location/barrier patterns
router.get("/patterns", getPatterns);

// Severity trends
router.get("/trends", getTrends);

// High-risk combinations
router.get("/high-risk", getHighRiskPatterns);

// Emerging trends
router.get("/emerging", getEmergingTrends);

module.exports = router;
