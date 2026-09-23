const express = require("express");
const { upload } = require("../middleware/documentRouter");
const {
  analyzeText,
  analyzeFile,
  saveReports,
  getDocuments,
  getDocumentById,
  clearDocuments,
  uploadDocumentController,
} = require("../controllers/documentController");

const router = express.Router();

// Permissive file upload middleware that accepts 'file', 'document', or any field
const uploadAny = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

// POST /api/documents/analyze-text
router.post("/analyze-text", analyzeText);

// POST /api/documents/analyze-file
router.post("/analyze-file", uploadAny, analyzeFile);

// POST /api/documents/save
router.post("/save", saveReports);

// GET /api/documents
router.get("/", getDocuments);

// GET /api/documents/:reportId
router.get("/:reportId", getDocumentById);

// POST /api/documents/clear
router.post("/clear", clearDocuments);

// POST /api/documents/upload (legacy route)
router.post("/upload", uploadAny, uploadDocumentController);

module.exports = router;
