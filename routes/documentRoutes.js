const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../middleware/documentRouter");
const {
    uploadDocumentController,
    getDocumentContextController,
} = require("../controllers/documentController");

const router = express.Router();

router.post(
    "/upload",
    authMiddleware,
    upload.single("document"),
    uploadDocumentController
);

router.get("/:id/context", authMiddleware, getDocumentContextController);

module.exports = router;
