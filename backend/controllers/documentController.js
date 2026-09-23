const { Document, Report } = require("../models/document");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const {
  forwardDocumentToNlp,
  isNlpSupportedExtension,
} = require("../services/nlpService");

const isMongoAvailable = () => mongoose.connection.readyState === 1;

const checkDbOr503 = (res) => {
  if (!isMongoAvailable()) {
    res.status(503).json({
      success: false,
      message: "Database service unavailable: MongoDB is not connected.",
    });
    return false;
  }
  return true;
};

const toPublicDocument = (doc) => ({
  id: String(doc._id || doc.id),
  userId: doc.userId,
  code: doc.code || `RPT-${String(doc._id || doc.id).slice(-4).toUpperCase()}`,
  title: doc.originalName || doc.title || "Safety Incident Report",
  date: doc.date || (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""),
  site: doc.site || doc.siteName || "Operational Facility",
  siteId: doc.siteId || "rig-site-a",
  originalName: doc.originalName || doc.title,
  filePath: doc.filePath,
  mimeType: doc.mimeType,
  fileSize: doc.fileSize,
  extractedText: doc.extractedText || doc.rawText || "",
  summary: doc.summary || (doc.extractedText ? doc.extractedText.slice(0, 280) : ""),
  hazard: doc.hazard || doc.primary_hazard || (doc.entities?.hazards?.[0]) || "General Observation",
  risk_level: doc.risk_level || doc.sif_precursor?.level || "Medium",
  precursor_score: doc.precursor_score || doc.sif_precursor?.severityScore || (doc.sif_precursor?.severity ? doc.sif_precursor.severity * 20 : 50),
  sif_precursor: Boolean(doc.sif_precursor?.severity >= 4 || doc.risk_level === "SIF-Precursor"),
  barrier_failure: doc.barrier_failure || (doc.entities?.barrierFailures?.[0]) || "None Identified",
  activity: doc.activity || (doc.entities?.activities?.[0]) || "Operational Activity",
  findings: doc.findings || doc.key_findings || [],
  recommendations: doc.recommendations || [],
  documentType: doc.documentType || "Incident Report",
  department: doc.department || "Operations",
  status: doc.status || "COMPLETED",
  processingStatus: doc.processingStatus || "Completed",
  createdAt: doc.createdAt || new Date().toISOString(),
});

const HAZARD_RULES = [
  {
    hazard: "Confined Space",
    keywords: ["confined space", "tank entry", "manhole", "vessel entry", "atmospheric monitoring", "oxygen deficiency", "toxic atmosphere", "asphyxiation", "sludge desilting"],
    severity: 5,
    risk_level: "SIF-Precursor",
    barrier_failure: "Atmospheric Testing & Entry Permit",
    activity: "Tank Cleaning & Maintenance",
  },
  {
    hazard: "Fall from Height",
    keywords: ["fall from height", "working at height", "scaffold", "safety harness", "lanyard", "fall arrest", "ladder fall", "open edge", "unharnessed"],
    severity: 4,
    risk_level: "High",
    barrier_failure: "Fall Arrest Harness & Guardrails",
    activity: "Working at Height",
  },
  {
    hazard: "Dropped Object",
    keywords: ["dropped object", "falling object", "crane lift", "rigging failure", "overhead lift", "hoist", "dropped tool", "suspended load", "casing clamp", "derrick inspection"],
    severity: 4,
    risk_level: "High",
    barrier_failure: "Rigging Inspection & Exclusion Zone",
    activity: "Lifting Operations",
  },
  {
    hazard: "Arc Flash / Electrocution",
    keywords: ["arc flash", "electrocution", "electric shock", "high voltage", "energized line", "switchgear", "live wire", "lockout tagout", "loto"],
    severity: 5,
    risk_level: "SIF-Precursor",
    barrier_failure: "LOTO Isolation & Arc Flash PPE",
    activity: "Electrical Maintenance",
  },
  {
    hazard: "Fire & Explosion",
    keywords: ["explosion", "fire broke out", "blast", "flammable vapour", "gas flare", "combustion", "hot work fire", "ignited", "blowout"],
    severity: 5,
    risk_level: "SIF-Precursor",
    barrier_failure: "Hot Work Permit & Fire Watch",
    activity: "Hot Work & Welding",
  },
  {
    hazard: "Toxic Gas Release",
    keywords: ["gas leak", "h2s", "hydrogen sulfide", "methane leak", "toxic gas", "chemical spill", "ammonia release", "acid leak"],
    severity: 5,
    risk_level: "SIF-Precursor",
    barrier_failure: "Gas Detection System & SCBA",
    activity: "Process Gas Handling",
  },
  {
    hazard: "High Pressure Release",
    keywords: ["pressure release", "burst pipe", "high pressure line", "hydraulic failure", "valve blowout", "uncontrolled release", "whip check"],
    severity: 4,
    risk_level: "High",
    barrier_failure: "Pressure Relief Valve & Bleed Down",
    activity: "Pipeline Operations",
  },
  {
    hazard: "Crush & Entrapment",
    keywords: ["pinch point", "caught in machinery", "conveyor entrapment", "crushed by", "entanglement", "rotating equipment"],
    severity: 4,
    risk_level: "High",
    barrier_failure: "Machine Guarding & E-Stop",
    activity: "Conveyor & Machinery Ops",
  },
];

function classifySafetyText(text = "") {
  const lower = text.toLowerCase();
  for (const rule of HAZARD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return {
        hazard: rule.hazard,
        risk_level: rule.risk_level,
        severity: rule.severity,
        precursor_score: rule.severity * 20,
        sif_precursor: { severity: rule.severity, level: rule.risk_level },
        barrier_failure: rule.barrier_failure,
        activity: rule.activity,
      };
    }
  }
  return {
    hazard: "General Observation",
    risk_level: "Low",
    severity: 1,
    precursor_score: 20,
    sif_precursor: { severity: 1, level: "Low" },
    barrier_failure: "None Identified",
    activity: "Routine Operations",
  };
}

// 1. POST /api/documents/analyze-text
const analyzeText = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const { text = "", filename = "pasted-report.txt", siteId, siteName } = req.body || {};
    if (!text.trim()) {
      return res.status(400).json({ success: false, message: "Report text is required for analysis." });
    }

    const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const code = `RPT-${Math.floor(1000 + Math.random() * 9000)}`;
    const siteTitle = siteName || (siteId ? siteId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "Operational Facility");

    const classification = classifySafetyText(text);

    // Real document creation in MongoDB
    const newDoc = await Document.create({
      userId: req.user?.id || "system",
      originalName: filename,
      filePath: "raw-text",
      mimeType: "text/plain",
      fileSize: Buffer.byteLength(text, "utf8"),
      rawText: text,
      extractedText: text,
      documentType: "Incident Report",
      status: "Completed",
      processingStatus: "Completed",
      site: siteTitle,
      siteId: siteId || "rig-site-a",
      hazard: classification.hazard,
      risk_level: classification.risk_level,
      precursor_score: classification.precursor_score,
      sif_precursor: classification.sif_precursor,
      barrier_failure: classification.barrier_failure,
      activity: classification.activity,
    });

    const report = toPublicDocument(newDoc);

    return res.status(200).json({
      success: true,
      analysis: {
        risk_level: report.risk_level,
        primary_hazard: report.hazard,
        precursor_score: report.precursor_score,
        sif_precursor: report.sif_precursor,
      },
      report,
    });
  } catch (err) {
    console.error("MongoDB analyzeText error:", err);
    return res.status(500).json({ success: false, message: "Failed to persist report to MongoDB", error: err.message });
  }
};

// 2. POST /api/documents/analyze-file
const analyzeFile = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { siteId, siteName } = req.body || {};
    let text = "";

    // 1. Try real Python NLP service if file extension is supported
    if (isNlpSupportedExtension(file.originalname)) {
      try {
        const nlpResult = await forwardDocumentToNlp({
          filePath: file.path,
          originalName: file.originalname,
          mimeType: file.mimetype,
        });
        if (nlpResult?.data?.extractedText) {
          text = nlpResult.data.extractedText;
        }
      } catch (nlpErr) {
        console.warn("NLP service unreachable, reading raw text if text file:", nlpErr.message);
      }
    }

    if (!text && file.path && fs.existsSync(file.path)) {
      try {
        text = fs.readFileSync(file.path, "utf8");
      } catch {
        text = `File uploaded: ${file.originalname}`;
      }
    }

    const siteTitle = siteName || (siteId ? siteId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "Operational Facility");
    const classification = classifySafetyText(text);

    // Real persistence in MongoDB
    const newDoc = await Document.create({
      userId: req.user?.id || "system",
      originalName: file.originalname,
      filePath: file.path || "",
      mimeType: file.mimetype || "application/octet-stream",
      fileSize: file.size || 0,
      rawText: text,
      extractedText: text,
      documentType: "Incident Report",
      status: "Completed",
      processingStatus: "Completed",
      site: siteTitle,
      siteId: siteId || "rig-site-a",
      hazard: classification.hazard,
      risk_level: classification.risk_level,
      precursor_score: classification.precursor_score,
      sif_precursor: classification.sif_precursor,
      barrier_failure: classification.barrier_failure,
      activity: classification.activity,
    });

    const report = toPublicDocument(newDoc);

    return res.status(200).json({
      success: true,
      report,
      reports: [report],
    });
  } catch (err) {
    console.error("MongoDB analyzeFile error:", err);
    return res.status(500).json({ success: false, message: "Failed to store document in MongoDB", error: err.message });
  }
};

// 3. POST /api/documents/save
const saveReports = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const { reports = [] } = req.body || {};
    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ success: false, message: "No reports provided to save" });
    }

    const savedReports = [];
    for (const r of reports) {
      const filter = mongoose.Types.ObjectId.isValid(r.id)
        ? { _id: r.id }
        : { originalName: r.code || r.title || r.id };

      const updateData = {
        userId: req.user?.id || "system",
        originalName: r.title || r.code || `report-${r.id}`,
        filePath: r.filePath || "saved-record",
        mimeType: r.mimeType || "text/plain",
        fileSize: r.fileSize || 1024,
        rawText: r.summary || r.extractedText || "",
        extractedText: r.extractedText || r.summary || "",
        documentType: r.documentType || "Incident Report",
        status: r.status || "Completed",
        processingStatus: "Completed",
        site: r.site || r.siteName || "Operational Facility",
        siteId: r.siteId || "rig-site-a",
        hazard: r.hazard || "General Observation",
        risk_level: r.risk_level || "Medium",
        precursor_score: r.precursor_score || 50,
        sif_precursor: {
          severity: Math.max(1, Math.min(5, Math.round((r.precursor_score || 50) / 20))),
          level: r.risk_level || "Medium",
        },
      };

      const doc = await Document.findOneAndUpdate(filter, updateData, {
        upsert: true,
        new: true,
      }).lean();

      savedReports.push(toPublicDocument(doc));
    }

    return res.status(200).json({ success: true, count: savedReports.length, reports: savedReports });
  } catch (err) {
    console.error("MongoDB saveReports error:", err);
    return res.status(500).json({ success: false, message: "Failed to save reports to database", error: err.message });
  }
};

// 4. GET /api/documents
const getDocuments = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const dbDocs = await Document.find().sort({ createdAt: -1 }).lean();
    const formatted = (dbDocs || []).map(toPublicDocument);
    return res.status(200).json({ success: true, documents: formatted, reports: formatted });
  } catch (err) {
    console.error("MongoDB getDocuments error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch documents from database", error: err.message });
  }
};

// 5. GET /api/documents/:reportId
const getDocumentById = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    const { reportId } = req.params;
    let doc = null;

    if (mongoose.Types.ObjectId.isValid(reportId)) {
      doc = await Document.findById(reportId).lean();
    }

    if (!doc) {
      doc = await Document.findOne({
        $or: [
          { originalName: reportId },
          { originalName: `report-${reportId}` },
        ],
      }).lean();
    }

    if (doc) {
      const formatted = toPublicDocument(doc);
      return res.status(200).json({ success: true, document: formatted, report: formatted });
    }

    return res.status(404).json({ success: false, message: "Document not found in database" });
  } catch (err) {
    console.error("MongoDB getDocumentById error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch document", error: err.message });
  }
};

// 6. POST /api/documents/clear
const clearDocuments = async (req, res) => {
  if (!checkDbOr503(res)) return;

  try {
    await Document.deleteMany({});
    await Report.deleteMany({});
    return res.status(200).json({ success: true, message: "All documents cleared from MongoDB successfully" });
  } catch (err) {
    console.error("MongoDB clearDocuments error:", err);
    return res.status(500).json({ success: false, message: "Failed to clear documents from database", error: err.message });
  }
};

module.exports = {
  analyzeText,
  analyzeFile,
  saveReports,
  getDocuments,
  getDocumentById,
  clearDocuments,
  uploadDocumentController: analyzeFile,
  uploadAndRouteDocument: analyzeFile,
};
