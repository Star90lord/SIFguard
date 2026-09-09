const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

// Upload directory
const uploadDir = path.join(__dirname, "..", "uploads");

// Make sure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        // Generate unique filename
        const uniqueFilename = `${randomUUID()}${extension}`;

        cb(null, uniqueFilename);
    }
});

// Allowed file types
const allowedExtensions = new Set([
    ".pdf",
    ".doc",
    ".docx",
    ".txt"
]);

const allowedMimeTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
]);

// File validation
const fileFilter = (req, file, cb) => {
    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const mimeType = file.mimetype;

    // Check both extension and MIME type
    if (
        allowedExtensions.has(extension) &&
        allowedMimeTypes.has(mimeType)
    ) {
        return cb(null, true);
    }

    return cb(
        new Error(
            "Invalid file type. Only PDF, DOC, DOCX and TXT files are allowed."
        )
    );
};

// Multer configuration
const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 1
    },

    fileFilter
});

module.exports = {
    upload,
    // Kept for backward compatibility with routes/documentRouter.js.
    // The NLP forwarding now happens inside the document controller,
    // so this middleware is intentionally a pass-through.
    routeDocument: (req, res, next) => next(),
};
