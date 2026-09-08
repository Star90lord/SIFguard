const { Document } = require("../models/user");

// Upload and route document
const uploadAndRouteDocument = async (req, res) => {
    try {
        // Check whether file was uploaded
        if (!req.file) {
            return res.status(400).json({
                message: "No document uploaded",
            });
        }

        // Check whether authentication middleware added the user
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Unauthorized. User not found.",
            });
        }

        // 1. Save document in database
        const newDoc = await Document.create({
          user: req.user.id,
          originalName: req.file.originalname,
          filePath: req.file.path,
          status: "Processing",
        });

        // 2. TODO: OCR
        // const extractedText = await runOCR(req.file.path);

        // 3. TODO: NLP
        // const department = await classifyDepartment(extractedText);

        // 4. TODO: Update document after OCR + NLP
        /*
        newDoc.extractedText = extractedText;
        newDoc.department = department;
        newDoc.status = "Routed";

        await newDoc.save();
        */

        return res.status(201).json({
            message: "Document uploaded successfully and is being processed",
            document: newDoc,
        });

    } catch (error) {
        console.error("Document upload error:", error);

        return res.status(500).json({
            message: "Upload failed",
            error: error.message,
        });
    }
};

module.exports = {
    uploadAndRouteDocument,
};
