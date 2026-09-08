const mongoose = require("mongoose");
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
            parsedContext: null,
            department: "Pending",
            status: "Processing",
        });

        try {
            const { processDocument } = req.app.locals;

            if (typeof processDocument !== "function") {
                throw new Error("Document processing service is unavailable");
            }

            const parsedContext = await processDocument(req.file.path);

            document.parsedContext = parsedContext;
            document.extractedText = JSON.stringify(parsedContext);
            document.status = "Routed";
            await document.save();
        } catch (processingError) {
            document.status = "Failed";
            await document.save();
            throw new Error(`Document processing failed: ${processingError.message}`);
        }

        return res.status(201).json({
            message: "Document uploaded successfully",
            document: {
                id: document._id,
                user: document.user,
                originalName: document.originalName,
                filePath: document.filePath,
                extractedText: document.extractedText,
                parsedContext: document.parsedContext,
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

const getDocumentContextController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User authentication required",
            });
        }

        if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid document id" });
        }

        const document = await Document.findOne({
            _id: req.params.id,
            "user.id": String(req.user.id),
        }).select("originalName parsedContext status createdAt updatedAt");

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        return res.status(200).json({
            document: {
                id: document._id,
                originalName: document.originalName,
                parsedContext: document.parsedContext,
                status: document.status,
                createdAt: document.createdAt,
                updatedAt: document.updatedAt,
            },
        });
    } catch (error) {
        console.error("Document context retrieval error:", error);
        return res.status(500).json({
            message: "Failed to retrieve document context",
        });
    }
};

module.exports = {
    uploadDocumentController,
    getDocumentContextController,
};
