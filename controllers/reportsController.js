const { Document } = require("../models/document");

// Get all analyzed reports
const getReports = async (req, res) => {
    try {
        const reports = await Document.find()
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            reports,
            count: reports.length,
        });
    } catch (error) {
        console.error("Get reports error:", error);

        return res.status(500).json({
            message: "Failed to fetch reports",
            error: error.message,
        });
    }
};

// Get a single report
const getReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await Document.findById(reportId).lean();

        if (!report) {
            return res.status(404).json({
                message: "Report not found",
            });
        }

        return res.status(200).json({
            report,
        });
    } catch (error) {
        console.error("Get report error:", error);

        return res.status(500).json({
            message: "Failed to fetch report",
            error: error.message,
        });
    }
};

// Get reports related to a particular report
const getRelatedReports = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await Document.findById(reportId).lean();

        if (!report) {
            return res.status(404).json({
                message: "Report not found",
            });
        }

        const query = {
            _id: { $ne: report._id },
        };

        // Prefer reports sharing the same document type.
        if (report.documentType && report.documentType !== "Unknown") {
            query.documentType = report.documentType;
        }

        let relatedReports = await Document.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // If there are not enough reports with the same type,
        // return recent reports instead.
        if (relatedReports.length === 0) {
            relatedReports = await Document.find({
                _id: { $ne: report._id },
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();
        }

        return res.status(200).json({
            reportId,
            relatedReports,
            count: relatedReports.length,
        });
    } catch (error) {
        console.error("Get related reports error:", error);

        return res.status(500).json({
            message: "Failed to fetch related reports",
            error: error.message,
        });
    }
};

// Get reports identified as SIF precursors
const getSifPrecursors = async (req, res) => {
    try {
        const reports = await Document.find({
            $or: [
                { "sif_precursor.sifPotential": "SIF-Potential" },
                { "sif_precursor.sifPotential": true },
                { "sifPrecursorSeverity.sifPotential": "SIF-Potential" },
                { "sifPrecursorSeverity.sifPotential": true },
            ],
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            reports,
            count: reports.length,
        });
    } catch (error) {
        console.error("Get SIF precursors error:", error);

        return res.status(500).json({
            message: "Failed to fetch SIF precursors",
            error: error.message,
        });
    }
};

module.exports = {
    getReports,
    getReport,
    getRelatedReports,
    getSifPrecursors,
};