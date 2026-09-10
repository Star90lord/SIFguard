"""SIFguard Python NLP service (FastAPI).

Full pipeline per document:
    upload -> text extraction -> cleaning -> DistilBERT NER
           -> risk matrix engine -> SIF precursor analysis -> response

The Risk Matrix Engine stays deterministic and separate from the NER
model: DistilBERT answers "what safety factors are present?", the risk
engine answers "how risky is this?".

Run from the project root:
    SIFvenv\\Scripts\\python.exe -m uvicorn nlp_service.main:app \
        --host 127.0.0.1 --port 8000
"""

import os
import sys
import tempfile
from pathlib import Path

# Allow `uvicorn nlp_service.main:app` from any working directory.
_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from fastapi import FastAPI, File, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from nlp_service._compat import ensure_regex_shim  # noqa: E402

ensure_regex_shim()

from nlp_service.analytics.trends_engine import (  # noqa: E402
    TrendsAnalysisEngine,
)
from nlp_service.models import sif_ner as ner_module  # noqa: E402
from nlp_service.risk.risk_engine import RiskMatrixEngine  # noqa: E402
from nlp_service.textextraction.extractor import (  # noqa: E402
    SUPPORTED_EXTENSIONS,
    extract_text,
)
from nlp_service.textcleaning.cleaner import clean_text  # noqa: E402


# .doc (legacy OLE) is rejected with a clear message, not silent garbage.
UPLOAD_SUFFIXES = sorted(SUPPORTED_EXTENSIONS)

app = FastAPI(title="SIFguard NLP Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_risk_engine = RiskMatrixEngine()
_trends_engine = TrendsAnalysisEngine()


# ==================== request models ====================


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000)


class AnalyticsRequest(BaseModel):
    reports: list = Field(default_factory=list)


# ==================== pipeline core ====================


def analyze_text_content(cleaned_text, raw_text=""):
    """NER + risk + SIF analysis for already-extracted text.

    Never raises for a missing model: degrades to empty entities with
    keyword-driven risk assessment and reports model.available=false.
    """
    entities_flat = []
    model_available = ner_module.is_model_available()
    model_error = None

    if model_available:
        try:
            entities_flat = ner_module.predict(cleaned_text)
        except Exception as error:
            model_error = str(error)
            entities_flat = []
    else:
        model_error = ner_module.get_load_error()

    grouped = ner_module.entities_by_type(entities_flat)

    risk = _risk_engine.assess(entities=grouped, text=cleaned_text or raw_text)

    legacy_entities = {
        "hazards": grouped.get("Hazard", []),
        "energies": grouped.get("Energy", []),
        "activities": grouped.get("Activity", []),
        "equipment": grouped.get("Equipment", []),
        "locations": grouped.get("Location", []),
        "barrier_failures": grouped.get("Barrier", []),
    }

    return {
        # Spec-shaped entity list (§15/§21).
        "extractedEntities": entities_flat,
        # Aliases expected by the Node.js document controller.
        "raw_ner_entities": entities_flat,
        "entities": legacy_entities,
        "risk_assessment": {
            "likelihood": risk["likelihood"],
            "likelihoodLabel": _risk_engine.likelihood_levels.get(
                risk["likelihood"], "Unknown"
            ),
            "severity": risk["severity"],
            "severityLabel": _risk_engine.severity_levels.get(
                risk["severity"], "Unknown"
            ),
            "riskScore": risk["riskScore"],
            "riskLevel": risk["riskLevel"],
            "sifPotential": risk["sifPotential"],
            "reasons": risk["reasons"],
        },
        "sif_precursor_severity": {
            "score": risk["severity"],
            "level": risk["riskLevel"],
            "scale": 5,
            "sifPotential": risk["sifPotential"],
            "reasons": risk["reasons"],
        },
        "model": {
            "available": model_available and model_error is None,
            "error": model_error,
            "labels": [
                "HAZARD",
                "ENERGY",
                "BARRIER",
                "ACTIVITY",
                "EQUIPMENT",
                "LOCATION",
            ],
        },
    }


# ==================== routes ====================


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "modelAvailable": ner_module.is_model_available(),
        "modelError": ner_module.get_load_error(),
    }


@app.get("/labels")
def labels():
    return {
        "labels": [
            "HAZARD",
            "ENERGY",
            "BARRIER",
            "ACTIVITY",
            "EQUIPMENT",
            "LOCATION",
        ]
    }


@app.post("/process-document")
async def process_document(document: UploadFile = File(...)):
    filename = document.filename or "upload"
    suffix = Path(filename).suffix.lower()

    if suffix == ".doc":
        raise HTTPException(
            status_code=400,
            detail=(
                "Legacy .doc files are not supported by the NLP service. "
                "Please re-save the report as DOCX, PDF or TXT and retry."
            ),
        )

    if suffix not in UPLOAD_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported document type '{suffix or '(none)'}'. "
                f"Supported: {', '.join(UPLOAD_SUFFIXES)}."
            ),
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        content = await document.read()
        if not content:
            raise HTTPException(
                status_code=400, detail="Uploaded file is empty."
            )
        temp.write(content)
        temp_path = temp.name

    try:
        try:
            extracted_text = extract_text(temp_path, filename)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error))

        if not extracted_text or not extracted_text.strip():
            raise HTTPException(
                status_code=422,
                detail=(
                    "No readable text could be extracted from the document "
                    "(empty or fully unscannable)."
                ),
            )

        cleaned = clean_text(extracted_text)
        if not cleaned:
            raise HTTPException(
                status_code=422,
                detail="Document text is empty after preprocessing.",
            )

        analysis = analyze_text_content(cleaned, extracted_text)

        return {
            "filename": filename,
            "extractedText": extracted_text,
            "raw_text": extracted_text,
            "cleanedText": cleaned,
            "cleaned_text": cleaned,
            "textLength": len(cleaned),
            "extractionStatus": "success",
            **analysis,
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/analyze/text")
def analyze_text(request: TextRequest):
    cleaned = clean_text(request.text)
    if not cleaned:
        raise HTTPException(
            status_code=422,
            detail="Text is empty after preprocessing.",
        )
    return {
        "cleanedText": cleaned,
        "cleaned_text": cleaned,
        "textLength": len(cleaned),
        **analyze_text_content(cleaned, request.text),
    }


@app.post("/analytics")
def analytics(request: AnalyticsRequest):
    if not isinstance(request.reports, list) or not request.reports:
        raise HTTPException(
            status_code=400,
            detail="Provide a non-empty 'reports' list.",
        )
    try:
        return _trends_engine.analyze(request.reports)
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"Analytics failed: {error}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "nlp_service.main:app",
        host=os.environ.get("NLP_HOST", "127.0.0.1"),
        port=int(os.environ.get("NLP_PORT", "8000")),
    )
