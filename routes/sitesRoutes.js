const express = require("express");
const { getSites, getSite, addSite, updateSite, compareSites, getSiteHistory } = require("../controllers/sitesController");
const router = express.Router();

router.get("/", getSites);
router.get("/compare", compareSites);
router.get("/:siteId/history", getSiteHistory);
router.get("/:siteId", getSite);
router.post("/", addSite);
router.put("/:siteId", updateSite);

module.exports = router;
