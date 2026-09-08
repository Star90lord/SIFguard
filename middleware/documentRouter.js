const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads/";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
        );
    },
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".txt"]);
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.has(extension)) {
        return cb(null, true);
    }

    return cb(new Error("Only PDF, DOC, DOCX and TXT files are allowed."));
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
});

module.exports = { upload };
