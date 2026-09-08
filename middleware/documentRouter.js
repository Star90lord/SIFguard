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
    const extension = path.extname(file.originalname).toLowerCase();

    // DocumentService currently extracts text with PyMuPDF, which only
    // supports the PDF upload pipeline used by this endpoint.
    if (extension === ".pdf") {
        return cb(null, true);
    }

    return cb(new Error("Only PDF files are allowed."));
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
});

module.exports = { upload };
