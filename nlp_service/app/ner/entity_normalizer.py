import re


# --------------------------------------------------
# Configuration
# --------------------------------------------------

MIN_ENTITY_LENGTH = 3

STOPWORD_FRAGMENTS = {
    "a",
    "an",
    "and",
    "at",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "the",
    "to",
    "was",
    "were",
    "with",
}

# --------------------------------------------------
# Contextual Entity Filtering
# --------------------------------------------------

INVALID_LABEL_COMBINATIONS = {
    "Activity": {
        "personnel",
    },
    "Barrier": {
        "safety",
    },
    "Hazard": {
        "struck",
    },
}


# --------------------------------------------------
# Text Normalization
# --------------------------------------------------

def normalize_entity_text(text: str) -> str:
    """
    Normalize whitespace and basic punctuation in an entity.
    """

    if not isinstance(text, str):
        return ""

    text = text.strip()
    text = re.sub(r"\s+", " ", text)

    return text


# --------------------------------------------------
# Fragment Validation
# --------------------------------------------------

def is_valid_entity_text(text: str) -> bool:
    """
    Determine whether an extracted entity contains enough
    meaningful information to be useful downstream.
    """

    if not text:
        return False

    normalized = text.lower().strip()

    if len(normalized) < MIN_ENTITY_LENGTH:
        return False

    if normalized in STOPWORD_FRAGMENTS:
        return False

    # Ignore entities made entirely from punctuation.
    if not re.search(r"[a-zA-Z0-9]", normalized):
        return False

    return True


def is_contextually_valid_entity(
    text: str,
    label: str
) -> bool:
    """
    Remove entity-label combinations that are known to be
    semantically weak for the SIFguard entity schema.

    The same word may still be valid under another label.
    """

    normalized_text = text.lower().strip()
    normalized_label = label.strip()

    invalid_entities = INVALID_LABEL_COMBINATIONS.get(
        normalized_label,
        set()
    )

    return normalized_text not in invalid_entities

# --------------------------------------------------
# Duplicate Removal
# --------------------------------------------------

def remove_duplicate_entities(
    entities: list[dict]
) -> list[dict]:
    """
    Remove exact duplicate entity text + label combinations.
    """

    unique_entities = []
    seen = set()

    for entity in entities:

        text = normalize_entity_text(
            entity.get("text", "")
        )

        label = entity.get("label", "")

        key = (
            label.lower().strip(),
            text.lower()
        )

        if key in seen:
            continue

        seen.add(key)

        unique_entities.append({
            "text": text,
            "label": label
        })

    return unique_entities


# --------------------------------------------------
# Overlapping Entity Removal
# --------------------------------------------------

def remove_redundant_entities(
    entities: list[dict]
) -> list[dict]:
    """
    Remove shorter entities when a longer entity with the
    same label already contains them.

    Example:

        dropped
        dropped object

    becomes:

        dropped object
    """

    result = []

    for index, entity in enumerate(entities):

        text = normalize_entity_text(
            entity.get("text", "")
        )

        label = entity.get("label", "")

        text_lower = text.lower()

        redundant = False

        for other_index, other in enumerate(entities):

            if index == other_index:
                continue

            other_text = normalize_entity_text(
                other.get("text", "")
            )

            other_label = other.get("label", "")

            if label != other_label:
                continue

            other_lower = other_text.lower()

            if text_lower == other_lower:
                continue

            if (
                len(other_lower) > len(text_lower)
                and text_lower in other_lower
            ):
                redundant = True
                break

        if not redundant:
            result.append(entity)

    return result


# --------------------------------------------------
# Subword Artifact Detection
# --------------------------------------------------

def is_likely_subword_artifact(
    text: str,
    entities: list[dict]
) -> bool:
    """
    Detect obvious fragments that appear to be a broken
    portion of another extracted entity.

    Example:

        separator
        arator

    The shorter 'arator' is treated as a likely artifact
    because it is a suffix of 'separator'.
    """

    normalized = text.lower().strip()

    for entity in entities:

        other_text = normalize_entity_text(
            entity.get("text", "")
        ).lower()

        if not other_text:
            continue

        if normalized == other_text:
            continue

        # Avoid removing legitimate words merely because
        # they share a few characters.
        if len(normalized) < 4:
            continue

        if (
            other_text.endswith(normalized)
            and len(other_text) >= len(normalized) + 3
        ):
            return True

    return False


# --------------------------------------------------
# Main Normalizer
# --------------------------------------------------

def normalize_entities(
    entities: list[dict]
) -> list[dict]:
    """
    Normalize and validate raw NER entities before they are
    used by risk assessment and returned by the API.
    """

    if not isinstance(entities, list):
        return []

    normalized_entities = []

    # --------------------------------------------------
    # 1. Basic normalization
    # --------------------------------------------------

    for entity in entities:

        if not isinstance(entity, dict):
            continue

        text = normalize_entity_text(
            entity.get("text", "")
        )

        label = entity.get("label", "")

        if not label:
            continue

        if not is_valid_entity_text(text):
            continue

        if not is_contextually_valid_entity(text, label):
            continue

        normalized_entities.append({
            "text": text,
            "label": label
        })
    # --------------------------------------------------
    # 2. Remove exact duplicates
    # --------------------------------------------------

    normalized_entities = remove_duplicate_entities(
        normalized_entities
    )

    # --------------------------------------------------
    # 3. Remove obvious subword artifacts
    # --------------------------------------------------

    filtered_entities = []

    for entity in normalized_entities:

        if is_likely_subword_artifact(
            entity["text"],
            normalized_entities
        ):
            continue

        filtered_entities.append(entity)

    normalized_entities = filtered_entities

    # --------------------------------------------------
    # 4. Remove redundant overlapping entities
    # --------------------------------------------------

    normalized_entities = remove_redundant_entities(
        normalized_entities
    )

    return normalized_entities