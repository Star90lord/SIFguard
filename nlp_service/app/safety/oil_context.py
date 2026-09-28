import json
import re
from nlp_service.app.core.config import DATA_DIR


OIL_CONTEXT_PATH = (
    DATA_DIR
    / "oil"
    / "safety_context.json"
)


def load_oil_context() -> dict:
    """
    Load Oil India Limited safety context.
    """

    if not OIL_CONTEXT_PATH.exists():
        raise FileNotFoundError(
            f"Oil safety context file not found: {OIL_CONTEXT_PATH}"
        )

    with OIL_CONTEXT_PATH.open(
        "r",
        encoding="utf-8"
    ) as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(
            "Oil safety context must be a JSON object."
        )

    return data


def get_context_terms(
    context_type: str
) -> list[str]:
    """
    Return terms belonging to a specific context group.

    Example:
        get_context_terms("equipment")
    """

    if not isinstance(context_type, str):
        raise TypeError(
            "context_type must be a string."
        )

    context_type = context_type.strip().lower()

    if not context_type:
        return []

    data = load_oil_context()

    context_terms = data.get(
        "context_terms",
        {}
    )

    terms = context_terms.get(
        context_type,
        []
    )

    if not isinstance(terms, list):
        raise ValueError(
            f"Context group '{context_type}' must contain a list."
        )

    return terms


def find_context_matches(
    text: str
) -> dict[str, list[str]]:
    """
    Find Oil India safety-context terms present in report text.

    Matching is sentence-aware so that generic software/data
    terminology does not automatically become Oil & Gas context.

    Example:
        "document intelligence pipeline"
        should not automatically classify the report as
        midstream pipeline context.

        "crude oil pipeline"
        should match midstream context.
    """

    if not isinstance(text, str):
        raise TypeError(
            "text must be a string."
        )

    if not text.strip():
        return {}

    data = load_oil_context()

    context_terms = data.get(
        "context_terms",
        {}
    )

    # Split the report into reasonably sized sentences/lines.
    sentences = re.split(
        r"(?<=[.!?])\s+|\n+",
        text.lower()
    )

    matches = {}

    # Terms that provide Oil & Gas evidence.
    oil_gas_indicators = {
        "oil",
        "gas",
        "hydrocarbon",
        "crude",
        "petroleum",
        "well",
        "wellhead",
        "drilling",
        "production",
        "separator",
        "compressor",
        "pump",
        "valve",
        "pressure",
        "process",
        "processing",
        "refinery",
        "terminal",
        "tank",
        "flare",
        "rig",
        "lift",
        "lifting",
        "pipeline",
        "pipe rack",
        "module",
        "platform",
    }

    for context_type, terms in context_terms.items():

        found_terms = []

        for term in terms:

            normalized_term = (
                term.lower().strip()
            )

            if not normalized_term:
                continue

            pattern = (
                r"(?<![a-zA-Z0-9])"
                + re.escape(normalized_term)
                + r"(?![a-zA-Z0-9])"
            )

            for sentence in sentences:

                if not re.search(
                    pattern,
                    sentence
                ):
                    continue

                # Count Oil & Gas evidence in the
                # same sentence.
                evidence_found = False

                for indicator in oil_gas_indicators:

                    indicator_pattern = (
                        r"(?<![a-zA-Z0-9])"
                        + re.escape(indicator)
                        + r"(?![a-zA-Z0-9])"
                    )

                    if re.search(
                        indicator_pattern,
                        sentence
                    ):
                        evidence_found = True
                        break

                if evidence_found:
                    found_terms.append(term)
                    break

        if found_terms:
            matches[context_type] = found_terms

    return matches