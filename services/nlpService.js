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
          headers: {
            ...form.getHeaders(),
            ...(process.env.SIFGUARD_API_KEY ? { Authorization: `Bearer ${process.env.SIFGUARD_API_KEY}` } : {}),
          },
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
            // Preserve backend error details without throwing
            return {
                ok: false,
                status: error.response.status,
                data: error.response.data
            };
        }
        if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.code === "EHOSTUNREACH") {
            return {
                ok: false,
                status: 503,
                data: {
                    detail: `NLP service unavailable at ${baseUrl}.`,
                    error: error.message
                }
            };
        }
        if (error.code === "ECONNABORTED") {
            return {
                ok: false,
                status: 504,
                data: {
                    detail: "NLP service timed out while analyzing the document."
                }
            };
        }
        // Unexpected error – propagate
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
