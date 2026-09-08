const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
    },
    { _id: false }
);

const documentSchema = new mongoose.Schema(
    {
        // This is a snapshot of the PostgreSQL account that uploaded the file.
        user: {
            type: userDetailsSchema,
            required: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        extractedText: {
            type: String,
            default: "",
        },
        department: {
            type: String,
            default: "Pending",
        },
        status: {
            type: String,
            enum: ["Uploaded", "Processing", "Routed", "Failed"],
            default: "Uploaded",
        },
    },
    {
        timestamps: true,
    }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = { Document };
