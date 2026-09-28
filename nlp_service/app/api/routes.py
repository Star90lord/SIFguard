from nlp_service.app.analytics.report_analytics import analyze_text
from nlp_service.app.api.response_mapper import map_analysis_result
import nlp_service.app.api.response_mapper as response_mapper
from pathlib import Path
import tempfile

from fastapi import APIRouter, File, UploadFile

from nlp_service.app.core.config import (
    SERVICE_NAME,
    SERVICE_VERSION,
    SUPPORTED_DOCUMENT_EXTENSIONS
)
from nlp_service.app.schemas.response import (
    HealthResponse,
    ErrorResponse,
    DocumentResponse
)
from nlp_service.app.extraction.document_parser import parse_document
from nlp_service.app.extraction.text_cleaner import clean_text


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service=SERVICE_NAME,
        version=SERVICE_VERSION
    )


@router.post("/process-document", response_model=DocumentResponse)
async def process_document(document: UploadFile = File(...)):
    temporary_path = None

    try:
        if not document.filename:
            return DocumentResponse(
                success=False,
                filename="",
                document_type="Unknown",
                error="No filename provided."
            )

        extension = Path(document.filename).suffix.lower()

        if extension not in SUPPORTED_DOCUMENT_EXTENSIONS:
            return DocumentResponse(
                success=False,
                filename=document.filename,
                document_type=extension or "Unknown",
                error=(
                    f"Unsupported document type: {extension}. "
                    f"Supported types: "
                    f"{', '.join(sorted(SUPPORTED_DOCUMENT_EXTENSIONS))}"
                )
            )

        file_content = await document.read()

        if not file_content:
            return DocumentResponse(
                success=False,
                filename=document.filename,
                document_type=extension,
                error="Uploaded document is empty."
            )

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temporary_file:
            temporary_file.write(file_content)
            temporary_path = Path(temporary_file.name)

        extracted_text = parse_document(temporary_path)
        cleaned_text = clean_text(extracted_text)

        character_count = len(cleaned_text)
        word_count = len(cleaned_text.split())

        analysis = analyze_text(
        cleaned_text
        )

        mapped_analysis = map_analysis_result(
            analysis
        )
        print("\n========== MAPPER DEBUG ==========")
        print("Loaded mapper from:")
        print(response_mapper.__file__)

        print("\nmap_entities source:")
        import inspect
        print(inspect.getsource(response_mapper.map_entities))

        print("===================================\n")

        return DocumentResponse(
            success=True,
            filename=document.filename,
            document_type=extension.lstrip(".").upper(),
            extracted_text=extracted_text,
            cleaned_text=cleaned_text,
            character_count=character_count,
            word_count=word_count,
            entities=mapped_analysis["entities"],
            extracted_entities=mapped_analysis[
                "extractedEntities"
            ],
            risk_assessment=mapped_analysis[
                "risk_assessment"
            ],
            sif_precursor_severity=mapped_analysis[
                "sif_precursor_severity"
            ],
            safety_analysis=mapped_analysis[
                "safety_analysis"
            ],
            sif_classification=mapped_analysis[
                "sif_classification"
            ],
            explanation=mapped_analysis[
                "explanation"
            ],
            analytics=mapped_analysis[
                "analytics"
            ],
            model=mapped_analysis[
                "model"
            ]
        )
        

    except Exception as error:
        return DocumentResponse(
            success=False,
            filename=document.filename or "",
            document_type=(
                Path(document.filename).suffix.lstrip(".").upper()
                if document.filename
                else "Unknown"
            ),
            error=str(error)
        )

    finally:
        if temporary_path and temporary_path.exists():
            temporary_path.unlink()