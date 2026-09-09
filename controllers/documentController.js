const { Document } = require("../models/user");
const pool = require("../database/pg");

const uploadDocumentController = async (req, res) => {
    try {
        // 1. Check whether a file was uploaded
        if (!req.file) {
            return res.status(400).json({
                message: "No document uploaded",
            });
        }

        // 2. Check authentication
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User authentication required",
            });
        }

        // 3. Verify that the PostgreSQL user exists
        const userResult = await pool.query(
            "SELECT id FROM users WHERE id = $1",
            [req.user.id]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({
                message: "User authentication required",
            });
        }

        // 4. Save document metadata in MongoDB
        const document = await Document.create({
            userId: String(user.id),

            originalName: req.file.originalname,

            filePath: req.file.path,

            mimeType: req.file.mimetype,

            fileSize: req.file.size,

            extractedText: "",

            documentType: "Unknown",

            department: "Pending",

            confidenceScore: null,

            status: "Uploaded",

            failureReason: "",
        });

        // 5. Send response
        return res.status(201).json({
            message: "Document uploaded successfully",

            document: {
                id: document._id,
                userId: document.userId,
                originalName: document.originalName,
                filePath: document.filePath,
                mimeType: document.mimeType,
                fileSize: document.fileSize,
                extractedText: document.extractedText,
                documentType: document.documentType,
                department: document.department,
                confidenceScore: document.confidenceScore,
                status: document.status,
                createdAt: document.createdAt,
            },
        });

    } catch (error) {
        console.error("Document upload error:", error);

        return res.status(500).json({
            message: "Failed to save document",
            error: error.message,
        });
    }
};

module.exports = {
    uploadDocumentController,
};

