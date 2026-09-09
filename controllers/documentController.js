const { Document } = require("../models/document");
const pool = require("../database/pg");
const {
    forwardDocumentToNlp,
    isNlpSupportedExtension,
} = require("../services/nlpService");

const toPublicDocument = (document) => ({
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
    processingStatus: document.processingStatus,
    createdAt: document.createdAt,
});

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

            rawText: "",

            extractedText: "",

            cleanedText: "",

            documentType: "Unknown",

            department: "Pending",

            confidenceScore: null,

            status: "Uploaded",

            processingStatus: "Uploaded",

            failureReason: "",
        });

        // 5. Forward the stored file to the existing NLP service.
        // The upload itself already succeeded, so an NLP failure must
        // NOT turn into a 500 upload failure — report it as nlpStatus.
        let nlpStatus = "skipped";
        let nlpResult = null;
        let nlpError = null;

        if (!isNlpSupportedExtension(req.file.originalname)) {
            nlpStatus = "skipped_unsupported_type";
            nlpError =
                "This file type is stored but is not supported by the NLP service " +
                "(supported: PDF, DOCX, TXT, JPG, JPEG, PNG, WEBP).";
        } else {
            try {
                const nlpResponse = await forwardDocumentToNlp({
                    filePath: req.file.path,
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                });

                nlpResult = nlpResponse.data || null;
                nlpStatus = "completed";

                const entities = nlpResult.entities || null;
                const severity =
                    nlpResult.sif_precursor_severity || null;

                document.rawText = nlpResult.raw_text || "";
                document.extractedText = nlpResult.raw_text || "";
                document.cleanedText = nlpResult.cleaned_text || "";
                if (entities) {
                    document.entities = {
                        hazards: entities.hazards || [],
                        activities: entities.activities || [],
                        locations: entities.locations || [],
                        barrierFailures: entities.barrier_failures || [],
                    };
                }
                if (severity) {
                    document.sifPrecursorSeverity = severity;
                    // Analytics queries `sif_precursor.severity`.
                    document.sif_precursor = {
                        severity: severity.score,
                        level: severity.level,
                        scale: severity.scale,
                        reasons: severity.reasons,
                    };
                }
                if (nlpResult.risk_assessment) {
                    document.riskAssessment = nlpResult.risk_assessment;
                }
                if (Array.isArray(nlpResult.raw_ner_entities)) {
                    document.rawNerEntities = nlpResult.raw_ner_entities;
                }
                document.status = "Completed";
                document.processingStatus = "Completed";
                await document.save();
            } catch (error) {
                if (error.isNlpUnavailable || error.isNlpTimeout) {
                    nlpStatus = "nlp_unavailable";
                    nlpError = error.message;
                } else if (error.isNlpError) {
                    nlpStatus = "nlp_rejected";
                    nlpError = error.message;
                    document.status = "Failed";
                    document.processingStatus = "Failed";
                    document.failureReason = error.message.slice(0, 500);
                    await document.save();
                } else {
                    throw error;
                }
            }
        }

        // 6. Send response
        const responseBody = {
            message:
                nlpStatus === "completed"
                    ? "Document uploaded and analyzed successfully"
                    : "Document uploaded successfully",

            document: toPublicDocument(document),

            nlpStatus,
        };

        if (nlpResult) {
            responseBody.nlpResult = {
                entities: nlpResult.entities,
                sif_precursor_severity: nlpResult.sif_precursor_severity,
                risk_assessment: nlpResult.risk_assessment,
            };
        }

        if (nlpError) {
            responseBody.nlpError = nlpError;
        }

        if (nlpStatus === "nlp_unavailable") {
            responseBody.message +=
                " (NLP service unavailable — document is stored and can be re-analyzed later)";
        }

        return res.status(201).json(responseBody);

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
    // Alias for the legacy routes/documentRouter.js which expects
    // `uploadAndRouteDocument`. Same handler, same flow.
    uploadAndRouteDocument: uploadDocumentController,
};

