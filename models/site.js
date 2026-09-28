const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            type: String,
            default: "",
            trim: true,
        },

        department: {
            type: String,
            default: "",
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },

        createdBy: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Site = mongoose.model("Site", siteSchema);

module.exports = { Site };