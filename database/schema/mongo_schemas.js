/**
 * SIFguard MongoDB Schemas
 * Used for Safety Incident Reports, Precursor Analytics, and Facility Directory.
 */

const mongoose = require("mongoose");

// 1. Safety Incident Report Schema
const reportSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    originalName: { type: String, required: true, trim: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    rawText: { type: String, default: "" },
    extractedText: { type: String, default: "" },
    cleanedText: { type: String, default: "" },
    entities: {
      hazards: { type: [String], default: [] },
      activities: { type: [String], default: [] },
      locations: { type: [String], default: [] },
      barrierFailures: { type: [String], default: [] },
    },
    processingStatus: {
      type: String,
      enum: ["Uploaded", "Parsing", "Cleaning", "Extracting", "Processing", "Completed", "Failed", "Routed"],
      default: "Uploaded",
      index: true,
    },
    status: { type: String, default: "Uploaded", index: true },
    documentType: { type: String, default: "Incident Report" },
    department: { type: String, default: "Pending" },
    confidenceScore: { type: Number, default: null },
    sif_precursor: { type: mongoose.Schema.Types.Mixed, default: null },
    sifPrecursorSeverity: { type: mongoose.Schema.Types.Mixed, default: null },
    riskAssessment: { type: mongoose.Schema.Types.Mixed, default: null },
    rawNerEntities: { type: [mongoose.Schema.Types.Mixed], default: [] },
    failureReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// 2. Operational Facility / Site Schema
const siteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    location: { type: String, default: "Operational Zone" },
    type: { type: String, default: "Rig Site" },
    status: { type: String, default: "Active" },
    totalReports: { type: Number, default: 0 },
    highRiskCount: { type: Number, default: 0 },
    sifCount: { type: Number, default: 0 },
    lastActivity: { type: String, default: "" },
    healthStatus: { type: String, default: "Stable" },
    healthDescription: { type: String, default: "" },
    riskCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    topHazards: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

// 3. Pending / Detected Facility Schema
const pendingSiteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, default: "Operational Zone" },
    type: { type: String, default: "Operational Facility" },
    sourceReportId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = {
  reportSchema,
  siteSchema,
  pendingSiteSchema,
};
