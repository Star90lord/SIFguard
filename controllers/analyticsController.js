
// controllers/analyticsController.js

const analyticsEngine = require("../services/analyticsEngine");

/*
|--------------------------------------------------------------------------
| GET COMPLETE ANALYTICS
|--------------------------------------------------------------------------
|
| GET /api/analytics
|
|--------------------------------------------------------------------------
*/

const getAnalytics = async (req, res) => {
  try {
    const filter = {};

    // If authentication middleware exists,
    // restrict analytics to the logged-in user.
    if (req.user?.id) {
      filter.userId = String(req.user.id);
    }

    const analytics =
      await analyticsEngine.generateAnalytics(filter);

    return res.status(200).json({
      success: true,
      message: "Analytics generated successfully.",
      data: analytics,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate analytics.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET OVERALL STATISTICS
|--------------------------------------------------------------------------
|
| GET /api/analytics/overview
|
|--------------------------------------------------------------------------
*/

const getOverview = async (req, res) => {
  try {
    const filter = {};

    if (req.user?.id) {
      filter.userId = String(req.user.id);
    }

    const statistics =
      await analyticsEngine.getOverallStatistics(filter);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("Overview analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate overview.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET PATTERNS
|--------------------------------------------------------------------------
|
| GET /api/analytics/patterns
|
|--------------------------------------------------------------------------
*/

const getPatterns = async (req, res) => {
  try {
    const filter = {};

    if (req.user?.id) {
      filter.userId = String(req.user.id);
    }

    const [
      hazards,
      activities,
      locations,
      barrierFailures,
    ] = await Promise.all([
      analyticsEngine.getHazardPatterns(filter),

      analyticsEngine.getActivityPatterns(filter),

      analyticsEngine.getLocationPatterns(filter),

      analyticsEngine.getBarrierFailurePatterns(filter),
    ]);

    return res.status(200).json({
      success: true,

      data: {
        hazards,
        activities,
        locations,
        barrierFailures,
      },
    });
  } catch (error) {
    console.error("Pattern analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate pattern analytics.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET TRENDS
|--------------------------------------------------------------------------
|
| GET /api/analytics/trends
|
| Query:
|
| ?period=month
| ?period=week
| ?period=day
|
|--------------------------------------------------------------------------
*/

const getTrends = async (req, res) => {
  try {
    const period = req.query.period || "month";

    if (!["day", "week", "month"].includes(period)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid period. Use day, week or month.",
      });
    }

    const filter = {};

    if (req.user?.id) {
      filter.userId = String(req.user.id);
    }

    const trends =
      await analyticsEngine.getSeverityTrends(
        filter,
        period
      );

    return res.status(200).json({
      success: true,

      period,

      data: trends,
    });
  } catch (error) {
    console.error("Trend analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate trend analytics.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET HIGH-RISK PATTERNS
|--------------------------------------------------------------------------
|
| GET /api/analytics/high-risk
|
|--------------------------------------------------------------------------
*/

const getHighRiskPatterns = async (req, res) => {
  try {
    const filter = {};

    if (req.user?.id) {
      filter.userId = String(req.user.id);
    }

    const patterns =
      await analyticsEngine.getHighRiskPatterns(
        filter
      );

    return res.status(200).json({
      success: true,

      data: patterns,
    });
  } catch (error) {
    console.error(
      "High-risk analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate high-risk patterns.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET EMERGING TRENDS
|--------------------------------------------------------------------------
|
| GET /api/analytics/emerging
|
| ?days=30
|
|--------------------------------------------------------------------------
*/

const getEmergingTrends = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;

    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message:
          "Days must be between 1 and 365.",
      });
    }

    const filter = {};

    if (req.user?.id) {
      filter.userId = String(req.user.id);
    }

    const trends =
      await analyticsEngine.getEmergingTrends(
        filter,
        days
      );

    return res.status(200).json({
      success: true,

      comparisonPeriod: `${days} days`,

      data: trends,
    });
  } catch (error) {
    console.error(
      "Emerging trend error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate emerging trends.",
      error: error.message,
    });
  }
};

module.exports = {
  getAnalytics,
  getOverview,
  getPatterns,
  getTrends,
  getHighRiskPatterns,
  getEmergingTrends,
};
