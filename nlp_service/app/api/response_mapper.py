def map_entities(
    entities: list[dict],
    barrier_failures: list[dict] | None = None
) -> dict[str, list[str]]:
    """
    Convert the flat NER entity list and detected barrier
    failures into the grouped structure expected by the
    SIFguard backend.
    """

    grouped = {
        "hazards": [],
        "energies": [],
        "activities": [],
        "equipment": [],
        "locations": [],
        "barrierFailures": [],
    }

    label_mapping = {
        "Hazard": "hazards",
        "Energy": "energies",
        "Activity": "activities",
        "Equipment": "equipment",
        "Location": "locations",
        "Barrier": "barrierFailures",
    }

    # --------------------------------------------------
    # 1. Map NER entities
    # --------------------------------------------------

    for entity in entities:

        label = entity.get("label")
        text = entity.get("text")

        if not label or not text:
            continue

        target = label_mapping.get(label)

        if target and text not in grouped[target]:
            grouped[target].append(text)

    # --------------------------------------------------
    # 2. Map deterministic barrier failures
    # --------------------------------------------------

    for failure in barrier_failures or []:

        barrier = failure.get("barrier")

        if not barrier:
            continue

        if barrier not in grouped["barrierFailures"]:
            grouped["barrierFailures"].append(
                barrier
            )

    return grouped



def map_extracted_entities(
    entities: list[dict]
) -> list[dict]:
    """
    Preserve the raw flat NER entities.

    No confidence or offsets are invented because the
    current predictor does not calculate them.
    """

    return [
        {
            "text": entity.get("text", ""),
            "label": entity.get("label", ""),
        }
        for entity in entities
        if entity.get("text")
    ]


def map_sif_precursor_severity(
    sif_classification: dict,
    risk_analysis: dict
) -> dict:
    """
    Convert the current SIF classifier output into the
    response structure expected by the backend/frontend.
    """

    return {
        "score": risk_analysis.get("risk_score", 0),
        "severity": risk_analysis.get("severity", 0),
        "level": risk_analysis.get("risk_level"),
        "scale": "1-5",
        "sifPotential": sif_classification.get(
            "sif_potential",
            False
        ),
        "reasons": sif_classification.get(
            "reasons",
            []
        ),
    }


def map_analysis_result(
    analysis: dict
) -> dict:
    """
    Convert the internal analyze_text() result into
    the API response contract used by SIFguard.
    """

    entities = analysis.get(
        "entities",
        []
    )

    risk_analysis = analysis.get(
        "risk_analysis",
        {}
    )

    sif_classification = analysis.get(
        "sif_classification",
        {}
    )

    return {
        "entities": map_entities(
            entities
        ),

        "extractedEntities": map_extracted_entities(
            entities
        ),

        "raw_ner_entities": map_extracted_entities(
            entities
        ),

        "risk_assessment": risk_analysis,

        "riskAnalysis": risk_analysis,

        "sif_precursor_severity": (
            map_sif_precursor_severity(
                sif_classification,
                risk_analysis
            )
        ),

        "safety_analysis": analysis.get(
            "safety_analysis",
            {}
        ),

        "sif_classification": sif_classification,

        "explanation": analysis.get(
            "explanation",
            {}
        ),

        "analytics": analysis.get(
            "analytics",
            {}
        ),

        "model": {
            "available": True,
            "name": "sif_distilbert",
        },
    }