
// services/analyticsEngine.js

const { Report } = require("../models/document");

/*
|--------------------------------------------------------------------------
| Utility Functions
|--------------------------------------------------------------------------
*/

function normalizeValue(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function incrementMap(map, value) {
  const normalized = normalizeValue(value);

  if (!normalized) return;

  map[normalized] = (map[normalized] || 0) + 1;
}

function mapToSortedArray(map, limit = 10) {
  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/*
|--------------------------------------------------------------------------
| 1. Overall Statistics
|--------------------------------------------------------------------------
*/

async function getOverallStatistics(filter = {}) {
  const reports = await Report.find(filter)
    .select("entities sif_precursor processingStatus createdAt")
    .lean();

  const totalReports = reports.length;

  let completedReports = 0;

  const severityDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let highRiskReports = 0;
  let criticalReports = 0;

  for (const report of reports) {
    if (report.processingStatus === "Completed") {
      completedReports++;
    }

    const severity = Number(report.sif_precursor?.severity);

    if (severity >= 1 && severity <= 5) {
      severityDistribution[severity]++;
    }

    if (severity === 4) {
      highRiskReports++;
    }

    if (severity === 5) {
      criticalReports++;
    }
  }

  return {
    totalReports,
    completedReports,
    highRiskReports,
    criticalReports,
    severityDistribution,
  };
}

/*
|--------------------------------------------------------------------------
| 2. Hazard Pattern Analysis
|--------------------------------------------------------------------------
*/

async function getHazardPatterns(filter = {}, limit = 10) {
  const reports = await Report.find(filter)
    .select("entities.hazards")
    .lean();

  const hazardMap = {};

  for (const report of reports) {
    const hazards = report.entities?.hazards || [];

    for (const hazard of hazards) {
      incrementMap(hazardMap, hazard);
    }
  }

  return mapToSortedArray(hazardMap, limit);
}

/*
|--------------------------------------------------------------------------
| 3. Activity Pattern Analysis
|--------------------------------------------------------------------------
*/

async function getActivityPatterns(filter = {}, limit = 10) {
  const reports = await Report.find(filter)
    .select("entities.activities")
    .lean();

  const activityMap = {};

  for (const report of reports) {
    const activities = report.entities?.activities || [];

    for (const activity of activities) {
      incrementMap(activityMap, activity);
    }
  }

  return mapToSortedArray(activityMap, limit);
}

/*
|--------------------------------------------------------------------------
| 4. Location Pattern Analysis
|--------------------------------------------------------------------------
*/

async function getLocationPatterns(filter = {}, limit = 10) {
  const reports = await Report.find(filter)
    .select("entities.locations")
    .lean();

  const locationMap = {};

  for (const report of reports) {
    const locations = report.entities?.locations || [];

    for (const location of locations) {
      incrementMap(locationMap, location);
    }
  }

  return mapToSortedArray(locationMap, limit);
}

/*
|--------------------------------------------------------------------------
| 5. Barrier Failure Pattern Analysis
|--------------------------------------------------------------------------
*/

async function getBarrierFailurePatterns(filter = {}, limit = 10) {
  const reports = await Report.find(filter)
    .select("entities.barrierFailures")
    .lean();

  const barrierMap = {};

  for (const report of reports) {
    const failures = report.entities?.barrierFailures || [];

    for (const failure of failures) {
      incrementMap(barrierMap, failure);
    }
  }

  return mapToSortedArray(barrierMap, limit);
}

/*
|--------------------------------------------------------------------------
| 6. Severity Trend Analysis
|--------------------------------------------------------------------------
|
| Groups reports by day/month and calculates:
|
| - total reports
| - average severity
| - high severity reports
| - critical reports
|
|--------------------------------------------------------------------------
*/

async function getSeverityTrends(filter = {}, period = "month") {
  let dateFormat;

  if (period === "day") {
    dateFormat = "%Y-%m-%d";
  } else if (period === "week") {
    dateFormat = "%Y-W%V";
  } else {
    dateFormat = "%Y-%m";
  }

  const matchStage = {
    ...filter,
    "sif_precursor.severity": {
      $gte: 1,
      $lte: 5,
    },
  };

  const trends = await Report.aggregate([
    {
      $match: matchStage,
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: "$createdAt",
          },
        },

        totalReports: {
          $sum: 1,
        },

        averageSeverity: {
          $avg: "$sif_precursor.severity",
        },

        highSeverityReports: {
          $sum: {
            $cond: [
              {
                $eq: ["$sif_precursor.severity", 4],
              },
              1,
              0,
            ],
          },
        },

        criticalReports: {
          $sum: {
            $cond: [
              {
                $eq: ["$sif_precursor.severity", 5],
              },
              1,
              0,
            ],
          },
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  return trends.map((item) => ({
    period: item._id,
    totalReports: item.totalReports,
    averageSeverity: Number(
      (item.averageSeverity || 0).toFixed(2)
    ),
    highSeverityReports: item.highSeverityReports,
    criticalReports: item.criticalReports,
  }));
}

/*
|--------------------------------------------------------------------------
| 7. High-Risk Pattern Detection
|--------------------------------------------------------------------------
|
| Finds combinations such as:
|
| Activity + Hazard + Location
|
| Example:
|
| welding
| +
| sparks
| +
| warehouse
|
|--------------------------------------------------------------------------
*/

async function getHighRiskPatterns(filter = {}, limit = 10) {
  const reports = await Report.find({
    ...filter,
    "sif_precursor.severity": {
      $gte: 4,
    },
  })
    .select(
      "entities.hazards entities.activities entities.locations entities.barrierFailures sif_precursor"
    )
    .lean();

  const patternMap = {};

  for (const report of reports) {
    const hazards = report.entities?.hazards || [];
    const activities = report.entities?.activities || [];
    const locations = report.entities?.locations || [];

    for (const activity of activities) {
      for (const hazard of hazards) {
        const key = `${normalizeValue(activity)} + ${normalizeValue(
          hazard
        )}`;

        patternMap[key] = (patternMap[key] || 0) + 1;
      }
    }

    for (const location of locations) {
      for (const hazard of hazards) {
        const key = `${normalizeValue(location)} + ${normalizeValue(
          hazard
        )}`;

        patternMap[key] = (patternMap[key] || 0) + 1;
      }
    }
  }

  return Object.entries(patternMap)
    .map(([pattern, count]) => ({
      pattern,
      occurrences: count,
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, limit);
}

/*
|--------------------------------------------------------------------------
| 8. Severity vs Hazard Analysis
|--------------------------------------------------------------------------
|
| Determines which hazards are associated with high severity.
|
|--------------------------------------------------------------------------
*/

async function getHazardSeverityAnalysis(filter = {}) {
  const reports = await Report.find(filter)
    .select("entities.hazards sif_precursor.severity")
    .lean();

  const hazardStats = {};

  for (const report of reports) {
    const hazards = report.entities?.hazards || [];
    const severity = Number(report.sif_precursor?.severity);

    if (!severity) continue;

    for (const hazard of hazards) {
      const normalized = normalizeValue(hazard);

      if (!normalized) continue;

      if (!hazardStats[normalized]) {
        hazardStats[normalized] = {
          occurrences: 0,
          totalSeverity: 0,
          highSeverityOccurrences: 0,
        };
      }

      hazardStats[normalized].occurrences++;
      hazardStats[normalized].totalSeverity += severity;

      if (severity >= 4) {
        hazardStats[normalized].highSeverityOccurrences++;
      }
    }
  }

  return Object.entries(hazardStats)
    .map(([hazard, stats]) => ({
      hazard,

      occurrences: stats.occurrences,

      averageSeverity: Number(
        (stats.totalSeverity / stats.occurrences).toFixed(2)
      ),

      highSeverityOccurrences: stats.highSeverityOccurrences,

      highSeverityRate: Number(
        (
          (stats.highSeverityOccurrences / stats.occurrences) *
          100
        ).toFixed(2)
      ),
    }))
    .sort((a, b) => {
      return b.averageSeverity - a.averageSeverity;
    });
}

/*
|--------------------------------------------------------------------------
| 9. Emerging Trend Detection
|--------------------------------------------------------------------------
|
| Compares recent reports with previous reports.
|
| Example:
|
| Previous month:
| welding = 5
|
| Current month:
| welding = 12
|
| Increase = 140%
|
|--------------------------------------------------------------------------
*/

async function getEmergingTrends(filter = {}, days = 30) {
  const now = new Date();

  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - days);

  const previousStart = new Date(now);
  previousStart.setDate(now.getDate() - days * 2);

  const currentReports = await Report.find({
    ...filter,
    createdAt: {
      $gte: currentStart,
      $lte: now,
    },
  })
    .select("entities")
    .lean();

  const previousReports = await Report.find({
    ...filter,
    createdAt: {
      $gte: previousStart,
      $lt: currentStart,
    },
  })
    .select("entities")
    .lean();

  function extractHazards(reports) {
    const map = {};

    for (const report of reports) {
      const hazards = report.entities?.hazards || [];

      for (const hazard of hazards) {
        incrementMap(map, hazard);
      }
    }

    return map;
  }

  const currentHazards = extractHazards(currentReports);
  const previousHazards = extractHazards(previousReports);

  const trends = [];

  for (const [hazard, currentCount] of Object.entries(
    currentHazards
  )) {
    const previousCount = previousHazards[hazard] || 0;

    let percentageIncrease = 0;

    if (previousCount === 0) {
      percentageIncrease = 100;
    } else {
      percentageIncrease =
        ((currentCount - previousCount) / previousCount) * 100;
    }

    if (percentageIncrease > 20) {
      trends.push({
        hazard,
        currentOccurrences: currentCount,
        previousOccurrences: previousCount,
        percentageIncrease: Number(
          percentageIncrease.toFixed(2)
        ),
        trend: "increasing",
      });
    }
  }

  return trends.sort(
    (a, b) =>
      b.percentageIncrease - a.percentageIncrease
  );
}

/*
|--------------------------------------------------------------------------
| 10. Generate Risk Insights
|--------------------------------------------------------------------------
|
| Converts analytics into human-readable insights.
|--------------------------------------------------------------------------
*/

async function generateInsights(filter = {}) {
  const statistics = await getOverallStatistics(filter);

  const hazards = await getHazardPatterns(filter, 5);

  const activities = await getActivityPatterns(filter, 5);

  const locations = await getLocationPatterns(filter, 5);

  const barriers = await getBarrierFailurePatterns(
    filter,
    5
  );

  const highRiskPatterns = await getHighRiskPatterns(
    filter,
    5
  );

  const insights = [];

  if (hazards.length > 0) {
    insights.push(
      `The most frequently reported hazard is "${hazards[0].name}" with ${hazards[0].count} occurrences.`
    );
  }

  if (activities.length > 0) {
    insights.push(
      `The most frequently reported activity is "${activities[0].name}" with ${activities[0].count} occurrences.`
    );
  }

  if (locations.length > 0) {
    insights.push(
      `The location with the highest number of identified safety issues is "${locations[0].name}".`
    );
  }

  if (barriers.length > 0) {
    insights.push(
      `The most common barrier failure is "${barriers[0].name}".`
    );
  }

  if (statistics.highRiskReports > 0) {
    insights.push(
      `${statistics.highRiskReports} report(s) were classified as high severity (level 4).`
    );
  }

  if (statistics.criticalReports > 0) {
    insights.push(
      `${statistics.criticalReports} report(s) were classified as critical severity (level 5).`
    );
  }

  if (highRiskPatterns.length > 0) {
    insights.push(
      `The strongest recurring high-risk combination is "${highRiskPatterns[0].pattern}".`
    );
  }

  return insights;
}

/*
|--------------------------------------------------------------------------
| 11. Complete Analytics Engine
|--------------------------------------------------------------------------
*/

async function generateAnalytics(filter = {}) {
  const [
    statistics,
    hazards,
    activities,
    locations,
    barrierFailures,
    severityTrends,
    highRiskPatterns,
    hazardSeverity,
    emergingTrends,
    insights,
  ] = await Promise.all([
    getOverallStatistics(filter),

    getHazardPatterns(filter),

    getActivityPatterns(filter),

    getLocationPatterns(filter),

    getBarrierFailurePatterns(filter),

    getSeverityTrends(filter),

    getHighRiskPatterns(filter),

    getHazardSeverityAnalysis(filter),

    getEmergingTrends(filter),

    generateInsights(filter),
  ]);

  return {
    generatedAt: new Date(),

    overview: statistics,

    patterns: {
      hazards,
      activities,
      locations,
      barrierFailures,
    },

    trends: {
      severity: severityTrends,
      emerging: emergingTrends,
    },

    highRiskPatterns,

    hazardSeverityAnalysis: hazardSeverity,

    insights,
  };
}

module.exports = {
  getOverallStatistics,
  getHazardPatterns,
  getActivityPatterns,
  getLocationPatterns,
  getBarrierFailurePatterns,
  getSeverityTrends,
  getHighRiskPatterns,
  getHazardSeverityAnalysis,
  getEmergingTrends,
  generateInsights,
  generateAnalytics,
};
