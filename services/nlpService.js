const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const NLP_BASE_URL =
    process.env.NLP_SERVICE_BASE_URL ||
    "http://127.0.0.1:8000";

const NLP_SERVICE_URL =
    process.env.NLP_SERVICE_URL ||
    `${NLP_BASE_URL}/process-document`;


/**
 * Return the base URL of the Python NLP service.
 *
 * Example:
 * http://127.0.0.1:8000
 */
const getNlpServiceUrl = () => {
    return NLP_BASE_URL;
};


/**
 * Check whether the uploaded file can be processed
 * by the Python NLP service.
 */
const isNlpSupportedExtension = (filename) => {
    if (!filename) {
        return false;
    }

    const supportedExtensions = [
        ".pdf",
        ".docx",
        ".txt",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    ];

    const extension = path.extname(filename).toLowerCase();

    return supportedExtensions.includes(extension);
};


/**
 * Forward uploaded document from Node.js to Python NLP service.
 */
const forwardDocumentToNlp = async ({
    filePath,
    originalName,
    mimeType,
}) => {
    if (!filePath) {
        throw new Error("File path is required.");
    }

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const formData = new FormData();

    formData.append(
        "document",
        fs.createReadStream(filePath),
        {
            filename: originalName,
            contentType: mimeType,
        }
    );

    try {
        const response = await axios.post(
            NLP_SERVICE_URL,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },

                maxContentLength: Infinity,

                maxBodyLength: Infinity,

                timeout: 120000,
            }
        );

        return {
            ok: true,
            status: response.status,
            data: response.data,
        };

    } catch (error) {

        // Python service responded with an HTTP error
        if (error.response) {
            return {
                ok: false,
                status: error.response.status,
                data: error.response.data,
            };
        }

        // Python service is not reachable
        if (
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND"
        ) {
            const unavailableError = new Error(
                "NLP service is unavailable."
            );

            unavailableError.isNlpUnavailable = true;

            throw unavailableError;
        }

        // Request timed out
        if (
            error.code === "ECONNABORTED" ||
            error.code === "ETIMEDOUT"
        ) {
            const timeoutError = new Error(
                "NLP service request timed out."
            );

            timeoutError.isNlpTimeout = true;

            throw timeoutError;
        }

        // Unknown error
        throw error;
    }
};


/**
 * Backward-compatible function.
 *
 * This allows any older code using:
 *
 * analyzeDocument(filePath, originalName)
 *
 * to continue working.
 */
const analyzeDocument = async (
    filePath,
    originalName
) => {
    return forwardDocumentToNlp({
        filePath,
        originalName,
        mimeType: "application/octet-stream",
    });
};


module.exports = {
    forwardDocumentToNlp,
    isNlpSupportedExtension,
    analyzeDocument,
    getNlpServiceUrl,
};