const { Document } = require("../models/user");
const pool = require("../database/pg");

const uploadDocumentController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No document uploaded",
            });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User authentication required",
            });
        }

        const userResult = await pool.query(
            "SELECT id, name, email FROM users WHERE id = $1",
            [req.user.id]
        );
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({
                message: "User authentication required",
            });
        }

        const document = await Document.create({
            user: {
                id: String(user.id),
                name: user.name,
                email: user.email,
            },
            originalName: req.file.originalname,
            filePath: req.file.path,
            extractedText: "",
            department: "Pending",
            status: "Uploaded",
        });

        return res.status(201).json({
            message: "Document uploaded successfully",
            document: {
                id: document._id,
                user: document.user,
                originalName: document.originalName,
                filePath: document.filePath,
                extractedText: document.extractedText,
                department: document.department,
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

module.exports = { uploadDocumentController };
