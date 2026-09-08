const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../middleware/documentRouter");
const {
    uploadDocumentController,
} = require("../controllers/documentController");

const router = express.Router();

router.post(
    "/upload",
    authMiddleware,
    upload.single("document"),
    uploadDocumentController
);

module.exports = router;
