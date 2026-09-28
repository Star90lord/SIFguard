import re


BARRIER_PATTERNS = {
    "Secondary retention": [
        "secondary retention not fitted",
        "secondary retention not installed",
        "no secondary retention",
        "safety sling not fitted",
        "safety sling not installed",
        "without secondary retention",
    ],

    "Exclusion zone": [
        "exclusion zone not enforced",
        "exclusion zone not maintained",
        "drop zone not controlled",
        "drop zone not barricaded",
        "potential drop zone",
        "workers remained inside",
        "personnel remained inside",
    ],

    "Sling condition": [
        "worn sling",
        "worn section",
        "sling shifted",
        "sling shift",
        "sling slipped",
        "soft sling allowed",
    ],

    "Lift plan": [
    "lift plan did not address",
    "lift plan not followed",
    "lift plan inadequate",
    "generic lift plan",
    "generic turnaround lift plan",
    "did not address soft-sling behavior",
    "jsa did not address",
    "jsa inadequate",
    ],
}


def _normalize_text(text: str) -> str:
    if not isinstance(text, str):
        raise TypeError("text must be a string.")

    return " ".join(
        text.lower().strip().split()
    )


def _phrase_matches(
    phrase: str,
    text: str
) -> bool:
    normalized_phrase = _normalize_text(phrase)

    if not normalized_phrase:
        return False

    pattern = (
        r"(?<![a-zA-Z0-9])"
        + re.escape(normalized_phrase)
        + r"(?![a-zA-Z0-9])"
    )

    return re.search(
        pattern,
        text
    ) is not None


def detect_barrier_failures(
    text: str
) -> list[dict]:

    if not isinstance(text, str):
        raise TypeError("text must be a string.")

    normalized_text = _normalize_text(text)

    if not normalized_text:
        return []

    failures = []

    for barrier_name, patterns in BARRIER_PATTERNS.items():

        matched_patterns = []

        for pattern in patterns:

            if _phrase_matches(
                pattern,
                normalized_text
            ):
                matched_patterns.append(pattern)

        if matched_patterns:

            failures.append({
                "barrier": barrier_name,
                "status": "Failed",
                "matched_patterns": matched_patterns
            })

    return failures