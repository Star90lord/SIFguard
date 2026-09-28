import re

from nlp_service.app.safety.iogp_rules import load_iogp_rules
from nlp_service.app.safety.oisd_rules import load_oisd_standards
from nlp_service.app.safety.oil_context import find_context_matches


def _normalize_text(text: str) -> str:
    if not isinstance(text, str):
        raise TypeError("text must be a string.")

    return " ".join(
        text.lower().strip().split()
    )


def _term_matches_text(
    term: str,
    text: str
) -> bool:
    """
    Match a safety term as a complete word or phrase.

    Prevents false substring matches such as:
        'sis' matching inside another word
        'rig' matching inside an unrelated word
        'ppe' matching inside another word
    """

    normalized_term = _normalize_text(term)

    if not normalized_term:
        return False

    pattern = (
        r"(?<![a-zA-Z0-9])"
        + re.escape(normalized_term)
        + r"(?![a-zA-Z0-9])"
    )

    return re.search(
        pattern,
        text
    ) is not None


def detect_iogp_rules(
    text: str
) -> list[dict]:

    normalized_text = _normalize_text(text)

    if not normalized_text:
        return []

    rules = load_iogp_rules()

    matches = []

    for rule in rules:

        matched_keywords = []

        for keyword in rule.get("keywords", []):

            if _term_matches_text(
                keyword,
                normalized_text
            ):
                matched_keywords.append(
                    keyword
                )

        if matched_keywords:

            matches.append({
                "rule_id": rule.get("id"),
                "rule": rule.get("name"),
                "key_action": rule.get("key_action"),
                "matched_keywords": matched_keywords
            })

    return matches


def detect_oisd_standards(
    text: str
) -> list[dict]:

    normalized_text = _normalize_text(text)

    if not normalized_text:
        return []

    standards = load_oisd_standards()

    matches = []

    for standard in standards:

        matched_keywords = []

        for keyword in standard.get("keywords", []):

            if _term_matches_text(
                keyword,
                normalized_text
            ):
                matched_keywords.append(
                    keyword
                )

        if matched_keywords:

            matches.append({
                "number": standard.get("number"),
                "name": standard.get("name"),
                "category": standard.get("category"),
                "matched_keywords": matched_keywords
            })

    return matches


def detect_oil_context(
    text: str
) -> dict[str, list[str]]:
    return find_context_matches(text)


def detect_precursors(
    text: str
) -> dict:

    if not isinstance(text, str):
        raise TypeError(
            "text must be a string."
        )

    if not text.strip():

        return {
            "iogp_rules": [],
            "oisd_standards": [],
            "oil_context": {}
        }

    return {
        "iogp_rules": detect_iogp_rules(text),
        "oisd_standards": detect_oisd_standards(text),
        "oil_context": detect_oil_context(text)
    }