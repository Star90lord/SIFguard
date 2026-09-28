const { Site } = require("../models/site");
const { Document } = require("../models/document");

// Get all sites
const getSites = async (req, res) => {
    try {
        const sites = await Site.find().sort({ createdAt: -1 });

        return res.status(200).json({
            sites,
            count: sites.length,
        });
    } catch (error) {
        console.error("Get sites error:", error);

        return res.status(500).json({
            message: "Failed to fetch sites",
            error: error.message,
        });
    }
};

// Get one site
const getSite = async (req, res) => {
    try {
        const { siteId } = req.params;

        const site = await Site.findById(siteId);

        if (!site) {
            return res.status(404).json({
                message: "Site not found",
            });
        }

        return res.status(200).json({
            site,
        });
    } catch (error) {
        console.error("Get site error:", error);

        return res.status(500).json({
            message: "Failed to fetch site",
            error: error.message,
        });
    }
};

// Add site
const addSite = async (req, res) => {
    try {
        const {
            name,
            location,
            department,
            description,
            status,
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Site name is required",
            });
        }

        const site = await Site.create({
            name: name.trim(),
            location: location || "",
            department: department || "",
            description: description || "",
            status: status || "Active",
            createdBy: req.user?.id ? String(req.user.id) : null,
        });

        return res.status(201).json({
            message: "Site created successfully",
            site,
        });
    } catch (error) {
        console.error("Add site error:", error);

        return res.status(500).json({
            message: "Failed to create site",
            error: error.message,
        });
    }
};

// Update site
const updateSite = async (req, res) => {
    try {
        const { siteId } = req.params;

        const allowedFields = [
            "name",
            "location",
            "department",
            "description",
            "status",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.name !== undefined) {
            if (!String(updates.name).trim()) {
                return res.status(400).json({
                    message: "Site name cannot be empty",
                });
            }

            updates.name = String(updates.name).trim();
        }

        const site = await Site.findByIdAndUpdate(
            siteId,
            updates,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!site) {
            return res.status(404).json({
                message: "Site not found",
            });
        }

        return res.status(200).json({
            message: "Site updated successfully",
            site,
        });
    } catch (error) {
        console.error("Update site error:", error);

        return res.status(500).json({
            message: "Failed to update site",
            error: error.message,
        });
    }
};

// Compare sites
const compareSites = async (req, res) => {
    try {
        const siteIds = req.query.siteIds
            ? String(req.query.siteIds)
                  .split(",")
                  .map((id) => id.trim())
                  .filter(Boolean)
            : [];

        if (siteIds.length < 2) {
            return res.status(400).json({
                message: "Provide at least two siteIds separated by commas",
            });
        }

        const sites = await Site.find({
            _id: { $in: siteIds },
        });

        const comparison = await Promise.all(
            sites.map(async (site) => {
                const documents = await Document.find({
                    "siteId": String(site._id),
                });

                return {
                    site,
                    totalReports: documents.length,
                };
            })
        );

        return res.status(200).json({
            comparison,
        });
    } catch (error) {
        console.error("Compare sites error:", error);

        return res.status(500).json({
            message: "Failed to compare sites",
            error: error.message,
        });
    }
};

// Get site history
const getSiteHistory = async (req, res) => {
    try {
        const { siteId } = req.params;

        const site = await Site.findById(siteId);

        if (!site) {
            return res.status(404).json({
                message: "Site not found",
            });
        }

        const documents = await Document.find({
            "siteId": String(siteId),
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            site,
            history: documents,
            count: documents.length,
        });
    } catch (error) {
        console.error("Get site history error:", error);

        return res.status(500).json({
            message: "Failed to fetch site history",
            error: error.message,
        });
    }
};

module.exports = {
    getSites,
    getSite,
    addSite,
    updateSite,
    compareSites,
    getSiteHistory,
};