const { Document } = require("../models/document");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeArray = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }

    return [];
};

const countValues = (documents, extractor) => {
    const counts = new Map();

    for (const document of documents) {
        const values = normalizeArray(extractor(document));

        for (const value of values) {
            counts.set(value, (counts.get(value) || 0) + 1);
        }
    }

    return Array.from(counts.entries())
        .map(([name, count]) => ({
            name,
            count,
        }))
        .sort((a, b) => b.count - a.count);
};

const getSeverityScore = (document) => {
    const sif = document.sif_precursor;

    if (sif && typeof sif === "object") {
        const value =
            sif.severity ??
            sif.score ??
            sif.severityScore;

        const number = Number(value);

        if (Number.isFinite(number)) {
            return number;
        }
    }

    if (typeof sif === "number") {
        return sif;
    }

    const risk = document.riskAssessment;

    if (risk && typeof risk === "object") {
        const value =
            risk.score ??
            risk.riskScore ??
            risk.severity;

        const number = Number(value);

        if (Number.isFinite(number)) {
            return number;
        }
    }

    return 0;
};

const getRiskLevel = (document) => {
    const risk = document.riskAssessment;

    if (risk && typeof risk === "object") {
        return (
            risk.level ||
            risk.riskLevel ||
            risk.risk_level ||
            "Unknown"
        );
    }

    return "Unknown";
};

const getSifPotential = (document) => {
    const sif = document.sif_precursor;

    if (sif && typeof sif === "object") {
        return (
            sif.sifPotential ??
            sif.sif_potential ??
            false
        );
    }

    return false;
};

const buildFilter = (filter = {}) => {
    const mongoFilter = {};

    if (filter.userId) {
        mongoFilter.userId = String(filter.userId);
    }

    return mongoFilter;
};

/*
|--------------------------------------------------------------------------
| Load analyzed documents
|--------------------------------------------------------------------------
*/

const getDocuments = async (filter = {}) => {
    return Document.find(buildFilter(filter))
        .sort({ createdAt: -1 })
        .lean();
};

/*
|--------------------------------------------------------------------------
| COMPLETE ANALYTICS
|--------------------------------------------------------------------------
*/

const generateAnalytics = async (filter = {}) => {
    const documents = await getDocuments(filter);

    const completed = documents.filter(
        (document) =>
            document.processingStatus === "Completed" ||
            document.status === "Completed"
    );

    const severityScores = completed
        .map(getSeverityScore)
        .filter((score) => Number.isFinite(score));

    const totalRiskScore = severityScores.reduce(
        (sum, score) => sum + score,
        0
    );

    const averageRiskScore =
        severityScores.length > 0
            ? Number(
                  (totalRiskScore / severityScores.length).toFixed(2)
              )
            : 0;

    const sifPotentialReports = completed.filter(
        getSifPotential
    ).length;

    return {
        totalReports: documents.length,

        completedReports: completed.length,

        failedReports: documents.filter(
            (document) =>
                document.processingStatus === "Failed" ||
                document.status === "Failed"
        ).length,

        sifPotentialReports,

        averageRiskScore,

        riskLevels: countValues(
            completed,
            getRiskLevel
        ),

        hazards: countValues(
            completed,
            (document) => document.entities?.hazards
        ),

        activities: countValues(
            completed,
            (document) => document.entities?.activities
        ),

        locations: countValues(
            completed,
            (document) => document.entities?.locations
        ),

        barrierFailures: countValues(
            completed,
            (document) => document.entities?.barrierFailures
        ),
    };
};

/*
|--------------------------------------------------------------------------
| OVERALL STATISTICS
|--------------------------------------------------------------------------
*/

const getOverallStatistics = async (filter = {}) => {
    const documents = await getDocuments(filter);

    const completed = documents.filter(
        (document) =>
            document.processingStatus === "Completed" ||
            document.status === "Completed"
    );

    const sifPotential = completed.filter(
        getSifPotential
    );

    const scores = completed
        .map(getSeverityScore)
        .filter((score) => Number.isFinite(score));

    const averageRiskScore =
        scores.length > 0
            ? Number(
                  (
                      scores.reduce((sum, score) => sum + score, 0) /
                      scores.length
                  ).toFixed(2)
              )
            : 0;

    return {
        totalReports: documents.length,
        analyzedReports: completed.length,
        pendingReports: documents.filter(
            (document) =>
                document.processingStatus !== "Completed" &&
                document.status !== "Completed"
        ).length,
        failedReports: documents.filter(
            (document) =>
                document.processingStatus === "Failed" ||
                document.status === "Failed"
        ).length,
        sifPotentialReports: sifPotential.length,
        averageRiskScore,
    };
};

/*
|--------------------------------------------------------------------------
| PATTERNS
|--------------------------------------------------------------------------
*/

const getHazardPatterns = async (filter = {}) => {
    const documents = await getDocuments(filter);

    return countValues(
        documents,
        (document) => document.entities?.hazards
    );
};

const getActivityPatterns = async (filter = {}) => {
    const documents = await getDocuments(filter);

    return countValues(
        documents,
        (document) => document.entities?.activities
    );
};

const getLocationPatterns = async (filter = {}) => {
    const documents = await getDocuments(filter);

    return countValues(
        documents,
        (document) => document.entities?.locations
    );
};

const getBarrierFailurePatterns = async (filter = {}) => {
    const documents = await getDocuments(filter);

    return countValues(
        documents,
        (document) => document.entities?.barrierFailures
    );
};

/*
|--------------------------------------------------------------------------
| SEVERITY TRENDS
|--------------------------------------------------------------------------
*/

const getSeverityTrends = async (
    filter = {},
    period = "month"
) => {
    const documents = await getDocuments(filter);

    const completed = documents.filter(
        (document) =>
            document.processingStatus === "Completed" ||
            document.status === "Completed"
    );

    const buckets = new Map();

    for (const document of completed) {
        if (!document.createdAt) {
            continue;
        }

        const date = new Date(document.createdAt);

        if (Number.isNaN(date.getTime())) {
            continue;
        }

        let key;

        if (period === "day") {
            key = date.toISOString().slice(0, 10);
        } else if (period === "week") {
            const firstDay = new Date(date);
            const day = firstDay.getDay();

            firstDay.setDate(
                firstDay.getDate() - day
            );

            key = firstDay.toISOString().slice(0, 10);
        } else {
            key =
                `${date.getFullYear()}-` +
                `${String(date.getMonth() + 1).padStart(2, "0")}`;
        }

        if (!buckets.has(key)) {
            buckets.set(key, {
                period: key,
                reports: 0,
                totalSeverity: 0,
                averageSeverity: 0,
            });
        }

        const bucket = buckets.get(key);

        bucket.reports += 1;
        bucket.totalSeverity += getSeverityScore(document);
    }

    return Array.from(buckets.values())
        .map((bucket) => ({
            ...bucket,
            averageSeverity:
                bucket.reports > 0
                    ? Number(
                          (
                              bucket.totalSeverity /
                              bucket.reports
                          ).toFixed(2)
                      )
                    : 0,
        }))
        .sort((a, b) =>
            a.period.localeCompare(b.period)
        );
};

/*
|--------------------------------------------------------------------------
| HIGH-RISK PATTERNS
|--------------------------------------------------------------------------
*/

const getHighRiskPatterns = async (filter = {}) => {
    const documents = await getDocuments(filter);

    const highRisk = documents.filter((document) => {
        const score = getSeverityScore(document);
        const level = String(
            getRiskLevel(document)
        ).toLowerCase();

        return (
            score >= 15 ||
            level.includes("high") ||
            level.includes("extreme") ||
            getSifPotential(document)
        );
    });

    return {
        totalHighRiskReports: highRisk.length,

        hazards: countValues(
            highRisk,
            (document) => document.entities?.hazards
        ),

        activities: countValues(
            highRisk,
            (document) => document.entities?.activities
        ),

        locations: countValues(
            highRisk,
            (document) => document.entities?.locations
        ),

        barrierFailures: countValues(
            highRisk,
            (document) => document.entities?.barrierFailures
        ),
    };
};

/*
|--------------------------------------------------------------------------
| EMERGING TRENDS
|--------------------------------------------------------------------------
*/

const getEmergingTrends = async (
    filter = {},
    days = 30
) => {
    const documents = await getDocuments(filter);

    const now = new Date();

    const currentStart = new Date(now);
    currentStart.setDate(
        currentStart.getDate() - days
    );

    const previousStart = new Date(currentStart);
    previousStart.setDate(
        previousStart.getDate() - days
    );

    const current = documents.filter((document) => {
        const date = new Date(document.createdAt);

        return (
            date >= currentStart &&
            date <= now
        );
    });

    const previous = documents.filter((document) => {
        const date = new Date(document.createdAt);

        return (
            date >= previousStart &&
            date < currentStart
        );
    });

    const getPatternCounts = (reports) => {
        const counts = new Map();

        for (const document of reports) {
            const hazards = normalizeArray(
                document.entities?.hazards
            );

            for (const hazard of hazards) {
                counts.set(
                    hazard,
                    (counts.get(hazard) || 0) + 1
                );
            }
        }

        return counts;
    };

    const currentCounts = getPatternCounts(current);
    const previousCounts = getPatternCounts(previous);

    const emerging = [];

    for (const [name, currentCount] of currentCounts) {
        const previousCount =
            previousCounts.get(name) || 0;

        if (currentCount > previousCount) {
            emerging.push({
                name,
                currentCount,
                previousCount,
                increase: currentCount - previousCount,
            });
        }
    }

    emerging.sort(
        (a, b) => b.increase - a.increase
    );

    return {
        days,
        currentPeriodReports: current.length,
        previousPeriodReports: previous.length,
        emergingHazards: emerging,
    };
};

module.exports = {
    generateAnalytics,
    getOverallStatistics,
    getHazardPatterns,
    getActivityPatterns,
    getLocationPatterns,
    getBarrierFailurePatterns,
    getSeverityTrends,
    getHighRiskPatterns,
    getEmergingTrends,
};