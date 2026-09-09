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
                "Completed",
                "Failed",
            ],
            default: "Uploaded",
            index: true,
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

module.exports = { Report };