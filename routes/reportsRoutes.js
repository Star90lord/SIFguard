const express = require("express");
const { getReports, getReport, getRelatedReports, getSifPrecursors } = require("../controllers/reportsController");
const router = express.Router();

router.get("/sif-precursors", getSifPrecursors);
router.get("/:reportId/related", getRelatedReports);
router.get("/:reportId", getReport);
router.get("/", getReports);

module.exports = router;
