// services/nlpService.js
//
// Backend integration layer for the existing (external) NLP service.
// The Python/FastAPI service itself is NOT modified here — this module
// only adapts the Node.js backend to the request format the NLP service
// already expects:
//
//   POST {NLP_SERVICE_URL}/process-document
//   Content-Type: multipart/form-data
//   Field: `document` (file)  — matches FastAPI param `document: UploadFile`
//   Optional field: `report_text` (string)
//
// NLP service reference: nlp_service/main.py -> process_document()

const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const getNlpServiceUrl = () => {
    return (
        process.env.NLP_SERVICE_URL ||
        "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");
};

const getNlpTimeout = () => {
    const parsed = Number(process.env.NLP_SERVICE_TIMEOUT_MS);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    // DistilBERT NER + OCR can be slow on first run.
    return 120000;
};

// The backend accepts .doc uploads but the NLP service only supports
// pdf/docx/txt/images. Forward everything and let the NLP service decide,
// but flag .doc so the controller can report a clear nlpStatus.
const isNlpSupportedExtension = (filename = "") => {
    const lower = String(filename).toLowerCase();
    return (
        lower.endsWith(".pdf") ||
        lower.endsWith(".docx") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp")
    );
};

const forwardDocumentToNlp = async ({ filePath, originalName, mimeType }) => {
    const baseUrl = getNlpServiceUrl();
    const url = `${baseUrl}/process-document`;

    const form = new FormData();
    form.append("document", fs.createReadStream(filePath), {
        filename: originalName,
        contentType: mimeType,
    });

    try {
        const response = await axios.post(url, form, {
            headers: form.getHeaders(),
            timeout: getNlpTimeout(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        return {
            ok: true,
            status: response.status,
            data: response.data,
        };
    } catch (error) {
        if (error.response) {
            // NLP service answered with 4xx/5xx — preserve its detail
            // so the backend can report it without masking it as a 500.
            const nlpError = new Error(
                (error.response.data &&
                    (error.response.data.detail ||
                        error.response.data.message)) ||
                    `NLP service responded with status ${error.response.status}`
            );
            nlpError.isNlpError = true;
            nlpError.nlpStatus = error.response.status;
            nlpError.nlpData = error.response.data;
            throw nlpError;
        }

        if (
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND" ||
            error.code === "EHOSTUNREACH"
        ) {
            const unavailable = new Error(
                `NLP service is unavailable at ${baseUrl}. ` +
                    "The document was stored but could not be analyzed."
            );
            unavailable.isNlpUnavailable = true;
            unavailable.cause = error;
            throw unavailable;
        }

        if (error.code === "ECONNABORTED") {
            const timeout = new Error(
                "NLP service timed out while analyzing the document. " +
                    "The document was stored; retry analysis later."
            );
            timeout.isNlpTimeout = true;
            timeout.cause = error;
            throw timeout;
        }

        throw error;
    }
};

const checkNlpHealth = async () => {
    const baseUrl = getNlpServiceUrl();
    const response = await axios.get(`${baseUrl}/health`, {
        timeout: 10000,
    });
    return response.data;
};

module.exports = {
    getNlpServiceUrl,
    getNlpTimeout,
    isNlpSupportedExtension,
    forwardDocumentToNlp,
    checkNlpHealth,
};
