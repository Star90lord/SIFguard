"""Entity-level NER metrics (seqeval-style, dependency-free).

Computes strict span-level precision / recall / F1 per entity type plus
micro-averaged overall scores from BIO label sequences. Used both for
best-checkpoint selection during training and for final test evaluation,
so the numbers are directly comparable.

Pure standard library + Python lists — no seqeval / sklearn required.
"""

ENTITY_TYPES = [
    "HAZARD",
    "ENERGY",
    "BARRIER",
    "ACTIVITY",
    "EQUIPMENT",
    "LOCATION",
]


def extract_spans(tag_sequence):
    """Convert a BIO tag sequence into {(type, start, end)} spans.

    Handles stray I- tags (no preceding B-) by starting a new span, so
    imperfect model output still scores deterministically.
    """
    spans = set()
    current_type = None
    current_start = None

    for index, tag in enumerate(list(tag_sequence) + ["O"]):
        if tag == "O" or "-" not in str(tag):
            if current_type is not None:
                spans.add((current_type, current_start, index - 1))
                current_type, current_start = None, None
            continue
        prefix, entity_type = str(tag).split("-", 1)
        if prefix == "B" or entity_type != current_type:
            if current_type is not None:
                spans.add((current_type, current_start, index - 1))
            current_type, current_start = entity_type, index
        # prefix == "I" with matching type simply extends the span.

    return spans


def score_sequences(true_sequences, pred_sequences):
    """Score lists of BIO tag sequences.

    Returns (per_type_metrics, overall_metrics) where each metric dict has
    precision / recall / f1 / predicted / actual / correct counts.
    """
    per_type = {
        entity: {"predicted": 0, "actual": 0, "correct": 0}
        for entity in ENTITY_TYPES
    }
    # Track unexpected labels too instead of silently ignoring them.
    extra = {}

    for true_tags, pred_tags in zip(true_sequences, pred_sequences):
        true_spans = extract_spans(true_tags)
        pred_spans = extract_spans(pred_tags)

        for span in pred_spans:
            bucket = (
                per_type.get(span[0])
                if span[0] in per_type
                else extra.setdefault(
                    span[0], {"predicted": 0, "actual": 0, "correct": 0}
                )
            )
            bucket["predicted"] += 1
        for span in true_spans:
            bucket = (
                per_type.get(span[0])
                if span[0] in per_type
                else extra.setdefault(
                    span[0], {"predicted": 0, "actual": 0, "correct": 0}
                )
            )
            bucket["actual"] += 1
        for span in pred_spans & true_spans:
            bucket = (
                per_type.get(span[0])
                if span[0] in per_type
                else extra[span[0]]
            )
            bucket["correct"] += 1

    def finalize(counts):
        predicted = counts["predicted"]
        actual = counts["actual"]
        correct = counts["correct"]
        precision = correct / predicted if predicted else 0.0
        recall = correct / actual if actual else 0.0
        f1 = (
            2 * precision * recall / (precision + recall)
            if (precision + recall) > 0
            else 0.0
        )
        return {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "predicted": predicted,
            "actual": actual,
            "correct": correct,
        }

    per_type_metrics = {
        entity: finalize(counts) for entity, counts in per_type.items()
    }
    if extra:
        per_type_metrics["_unexpected_labels"] = {
            label: finalize(counts) for label, counts in extra.items()
        }

    totals = {
        "predicted": sum(counts["predicted"] for counts in per_type.values()),
        "actual": sum(counts["actual"] for counts in per_type.values()),
        "correct": sum(counts["correct"] for counts in per_type.values()),
    }
    overall = finalize(totals)
    overall["support"] = totals["actual"]

    return per_type_metrics, overall
