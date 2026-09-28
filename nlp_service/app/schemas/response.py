from typing import Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str


class DocumentResponse(BaseModel):
    success: bool
    filename: str
    document_type: str

    extracted_text: str = ""
    cleaned_text: str = ""

    character_count: int = Field(
        default=0,
        ge=0
    )

    word_count: int = Field(
        default=0,
        ge=0
    )

    entities: dict[str, list[str]] = Field(
        default_factory=lambda: {
            "hazards": [],
            "energies": [],
            "activities": [],
            "equipment": [],
            "locations": [],
            "barrierFailures": [],
        }
    )

    extracted_entities: list[dict] = Field(
        default_factory=list
    )

    risk_assessment: Optional[dict] = None

    sif_precursor_severity: Optional[dict] = None

    safety_analysis: dict = Field(
        default_factory=dict
    )

    sif_classification: dict = Field(
        default_factory=dict
    )

    explanation: dict = Field(
        default_factory=dict
    )

    analytics: dict = Field(
        default_factory=dict
    )

    model: dict = Field(
        default_factory=dict
    )

    error: Optional[str] = None