const mongoose = require("mongoose");

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

const Site = mongoose.models.Site || mongoose.model("Site", siteSchema);
const PendingSite = mongoose.models.PendingSite || mongoose.model("PendingSite", pendingSiteSchema);

module.exports = { Site, PendingSite };
