const express = require("express");
const router = express.Router();
const {
  getSites,
  addSite,
  getPendingSites,
  confirmPendingSite,
} = require("../controllers/siteController");

// GET /api/sites
router.get("/", getSites);

// POST /api/sites
router.post("/", addSite);

// GET /api/sites/pending
router.get("/pending", getPendingSites);

// POST /api/sites/confirm
router.post("/confirm", confirmPendingSite);

module.exports = router;
