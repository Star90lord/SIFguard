# --------------------------------------------------
# SIFguard NER Labels
# --------------------------------------------------

LABELS = [
    "O",

    "B-Hazard",
    "I-Hazard",

    "B-Energy",
    "I-Energy",

    "B-Barrier",
    "I-Barrier",

    "B-Activity",
    "I-Activity",

    "B-Equipment",
    "I-Equipment",

    "B-Location",
    "I-Location"
]


# --------------------------------------------------
# Label Mappings
# --------------------------------------------------

LABEL2ID = {
    label: index
    for index, label in enumerate(LABELS)
}


ID2LABEL = {
    index: label
    for index, label in enumerate(LABELS)
}


# --------------------------------------------------
# Entity Types
# --------------------------------------------------

ENTITY_TYPES = [
    "Hazard",
    "Energy",
    "Barrier",
    "Activity",
    "Equipment",
    "Location"
]


# --------------------------------------------------
# Validation
# --------------------------------------------------

def is_valid_label(label: str) -> bool:
    """
    Check whether a label belongs to the SIFguard
    NER label set.
    """

    return label in LABEL2ID