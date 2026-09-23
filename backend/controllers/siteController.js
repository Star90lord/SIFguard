const mongoose = require("mongoose");
const { Site, PendingSite } = require("../models/site");

const isMongoAvailable = () => mongoose.connection.readyState === 1;

const checkDbOr503 = (res) => {
  if (!isMongoAvailable()) {
    res.status(503).json({
      success: false,
      message: "Database service unavailable: MongoDB is not connected.",
    });
    return false;
  }
  return true;
};

// GET /api/sites
const getSites = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const dbSites = await Site.find().lean();
    return res.status(200).json({ success: true, sites: dbSites || [] });
  } catch (err) {
    console.error("MongoDB getSites error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve sites from database", error: err.message });
  }
};

// POST /api/sites
const addSite = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const siteData = req.body || {};
    if (!siteData.name || typeof siteData.name !== "string" || !siteData.name.trim()) {
      return res.status(400).json({ success: false, message: "Site name is required." });
    }

    const name = siteData.name.trim();
    const id = siteData.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newSite = {
      id,
      name,
      code: siteData.code || `${name.slice(0, 3).toUpperCase()}-001`,
      location: siteData.location || "Operational Zone",
      type: siteData.type || "Operational Facility",
      status: siteData.status || "Active",
    };

    const saved = await Site.findOneAndUpdate({ id }, newSite, { upsert: true, new: true }).lean();
    await PendingSite.deleteOne({ id });

    return res.status(201).json({ success: true, site: saved });
  } catch (err) {
    console.error("MongoDB addSite error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to save site to database", error: err.message });
  }
};

// GET /api/sites/pending
const getPendingSites = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const pending = await PendingSite.find().lean();
    return res.status(200).json({ success: true, pendingSites: pending || [] });
  } catch (err) {
    console.error("MongoDB getPendingSites error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to query pending sites from database", error: err.message });
  }
};

// POST /api/sites/confirm
const confirmPendingSite = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const { siteId } = req.body || {};
    if (!siteId) {
      return res.status(400).json({ success: false, message: "siteId is required" });
    }

    const target = await PendingSite.findOne({ id: siteId }).lean();
    if (!target) {
      return res.status(404).json({ success: false, message: `Pending site "${siteId}" not found in database.` });
    }

    await PendingSite.deleteOne({ id: siteId });
    const confirmed = await Site.findOneAndUpdate(
      { id: target.id },
      { ...target, status: "Active" },
      { upsert: true, new: true }
    ).lean();

    return res.status(200).json({ success: true, confirmedSite: confirmed });
  } catch (err) {
    console.error("MongoDB confirmPendingSite error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to confirm pending site", error: err.message });
  }
};

module.exports = {
  getSites,
  addSite,
  getPendingSites,
  confirmPendingSite,
};
