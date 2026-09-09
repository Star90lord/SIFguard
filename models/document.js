const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },

        originalName: {
            type: String,
            required: true,
            trim: true,
        },

        filePath: {
            type: String,
            required: true,
        },

        mimeType: {
            type: String,
            required: true,
        },

        fileSize: {
            type: Number,
            required: true,
        },

        // Filled after document parsing
        rawText: {
            type: String,
            default: "",
        },

        // Legacy alias used by the upload controller.
        // Kept in sync with rawText by the controller.
        extractedText: {
            type: String,
            default: "",
        },

        // Filled after text cleaning
        cleanedText: {
            type: String,
            default: "",
        },

        // Filled after NLP processing
        entities: {
            hazards: {
                type: [String],
                default: [],
            },

            activities: {
                type: [String],
                default: [],
            },

            locations: {
                type: [String],
                default: [],
            },

            barrierFailures: {
                type: [String],
                default: [],
            },
        },

        processingStatus: {
            type: String,
            enum: [
                "Uploaded",
                "Parsing",
                "Cleaning",
                "Extracting",
                "Processing",
                "Completed",
                "Failed",
                "Routed",
            ],
            default: "Uploaded",
            index: true,
        },

        // Legacy alias used by the upload controller response.
        // Kept in sync with processingStatus by the controller.
        status: {
            type: String,
            default: "Uploaded",
            index: true,
        },

        // Legacy classification fields used by the upload controller.
        documentType: {
            type: String,
            default: "Unknown",
        },

        department: {
            type: String,
            default: "Pending",
        },

        confidenceScore: {
            type: Number,
            default: null,
        },

        // SIF precursor severity stored for analytics.
        // Analytics queries `sif_precursor.severity`; the NLP service
        // returns `sif_precursor_severity.score`, so the backend stores
        // both shapes when NLP results arrive.
        sif_precursor: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        sifPrecursorSeverity: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        riskAssessment: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        rawNerEntities: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },

        failureReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Report = mongoose.model("Report", reportSchema);

module.exports = { Report, Document: Report };