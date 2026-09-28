import json

from nlp_service.app.core.config import DATA_DIR


# --------------------------------------------------
# OISD Standards Path
# --------------------------------------------------

OISD_RULES_PATH = (
    DATA_DIR
    / "oisd"
    / "safety_rules.json"
)


# --------------------------------------------------
# Load OISD Standards
# --------------------------------------------------

def load_oisd_standards() -> list[dict]:
    """
    Load OISD safety standards from JSON.
    """

    if not OISD_RULES_PATH.exists():
        raise FileNotFoundError(
            f"OISD standards file not found: {OISD_RULES_PATH}"
        )

    with OISD_RULES_PATH.open(
        "r",
        encoding="utf-8"
    ) as file:
        data = json.load(file)

    standards = data.get("standards")

    if not isinstance(standards, list):
        raise ValueError(
            "OISD JSON must contain a 'standards' list."
        )

    return standards


# --------------------------------------------------
# Find Standard by Number
# --------------------------------------------------

def get_oisd_standard(
    standard_number: str
) -> dict | None:
    """
    Find an OISD standard by its document number.

    Example:
        OISD-STD-105
    """

    if not isinstance(standard_number, str):
        raise TypeError(
            "standard_number must be a string."
        )

    target = standard_number.strip().upper()

    for standard in load_oisd_standards():
        if standard.get("number", "").upper() == target:
            return standard

    return None


# --------------------------------------------------
# Find Standards by Keyword
# --------------------------------------------------

def find_oisd_standards(
    keyword: str
) -> list[dict]:
    """
    Find OISD standards whose keywords contain
    the supplied search term.
    """

    if not isinstance(keyword, str):
        raise TypeError(
            "keyword must be a string."
        )

    target = keyword.strip().lower()

    if not target:
        return []

    matches = []

    for standard in load_oisd_standards():
        keywords = standard.get("keywords", [])

        for item in keywords:
            if target in item.lower():
                matches.append(standard)
                break

    return matches