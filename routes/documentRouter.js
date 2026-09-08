const express = require("express");

const router = express.Router();

// Authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

// Document middleware
const {
    upload,
    routeDocument,
} = require("../middleware/documentRouter");

// Document controller
const {
    uploadAndRouteDocument,
} = require("../controllers/documentController");


// POST /api/documents/upload
//
// Request flow:
//
// authMiddleware
//      ↓
// upload.single("document")
//      ↓
// routeDocument
//      ↓
// uploadAndRouteDocument

router.post(
    "/upload",
    authMiddleware,
    upload.single("document"),
    routeDocument,
    uploadAndRouteDocument
);


module.exports = router;
