"""SIFguard NER dataset validation.

Reads the raw character-span annotated JSONL dataset, checks every record,
and produces a machine-readable report (dataset/processed/dataset_report.json)
plus a human-readable console summary.

Pure standard library — no torch/transformers required.

Nothing is deleted or modified. Records that would need a human decision are
flagged in the report instead of being silently dropped.

Usage:
    SIFvenv\\Scripts\\python.exe nlp_service/training/validate_dataset.py
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

CANDIDATE_INPUTS = [
    PROJECT_ROOT / "dataset" / "sif_ner_dataset (1).jsonl",
    PROJECT_ROOT / "dataset" / "sif_ner_dataset.jsonl",
]

# NOTE: processed outputs intentionally live under `dataset/` (singular).
# A top-level `datasets/` directory would shadow the Hugging Face
# `datasets` package and crash transformers.Trainer.
REPORT_PATH = PROJECT_ROOT / "dataset" / "processed" / "dataset_report.json"

# Canonical NER label space (uppercase, per project spec).
CANONICAL_LABELS = {
    "HAZARD",
    "ENERGY",
    "BARRIER",
    "ACTIVITY",
    "EQUIPMENT",
    "LOCATION",
}

VALID_SPLITS = {"train", "validation", "test"}


def find_input():
    for candidate in CANDIDATE_INPUTS:
        if candidate.is_file():
            return candidate
    return None


def main():
    input_file = find_input()
    if input_file is None:
        print("ERROR: NER dataset file not found. Looked in:")
        for candidate in CANDIDATE_INPUTS:
            print(f"  - {candidate}")
        sys.exit(1)

    print(f"Validating dataset: {input_file}")

    malformed_lines = []
    records = []
    with open(input_file, "r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as error:
                malformed_lines.append(
                    {"line": line_number, "error": str(error)}
                )
                continue
            records.append({"line": line_number, "record": record})

    total_records = len(records)

    # ---------------- counters ----------------
    missing_text = []
    missing_entities_key = []
    empty_entities = []
    entity_not_list = []
    invalid_offsets = []
    empty_span_text = []
    unknown_labels = []
    overlapping_spans = []
    label_counter = Counter()
    split_counter = Counter()
    augmented_counter = Counter()
    metadata_presence = Counter()

    # text -> list of (line, split, is_augmented) for duplicate/leakage checks
    text_index = defaultdict(list)

    for item in records:
        line_number = item["line"]
        record = item["record"]
        if not isinstance(record, dict):
            malformed_lines.append(
                {"line": line_number, "error": "record is not a JSON object"}
            )
            continue

        text = record.get("text", "")
        if not isinstance(text, str) or not text.strip():
            missing_text.append(line_number)
            continue

        for meta in (
            "severity",
            "risk_type",
            "industry",
            "source",
            "is_augmented",
            "split",
        ):
            if record.get(meta) not in (None, ""):
                metadata_presence[meta] += 1

        split = record.get("split", "")
        split_counter[str(split)] += 1
        augmented_counter[str(record.get("is_augmented"))] += 1

        text_index[text.strip().lower()].append(
            {
                "line": line_number,
                "split": split,
                "is_augmented": record.get("is_augmented"),
            }
        )

        if "entities" not in record:
            missing_entities_key.append(line_number)
            continue

        entities = record["entities"]
        if not isinstance(entities, list):
            entity_not_list.append(line_number)
            continue
        if len(entities) == 0:
            empty_entities.append(line_number)
            continue

        spans = []
        record_has_bad_offset = False
        for entity in entities:
            if not isinstance(entity, dict):
                record_has_bad_offset = True
                continue
            start = entity.get("start")
            end = entity.get("end")
            raw_label = entity.get("label", "")
            label = str(raw_label).upper()

            if label in CANONICAL_LABELS:
                label_counter[label] += 1
            else:
                unknown_labels.append(
                    {"line": line_number, "label": raw_label}
                )

            valid_types = isinstance(start, int) and isinstance(end, int)
            in_range = (
                valid_types
                and 0 <= start < end <= len(text)
            )
            if not in_range:
                record_has_bad_offset = True
                continue
            span_text = text[start:end]
            if not span_text.strip():
                empty_span_text.append(
                    {
                        "line": line_number,
                        "start": start,
                        "end": end,
                        "label": raw_label,
                    }
                )
                record_has_bad_offset = True
                continue
            spans.append((start, end))

        if record_has_bad_offset:
            invalid_offsets.append(line_number)

        ordered = sorted(spans)
        for first, second in zip(ordered, ordered[1:]):
            if first[1] > second[0]:
                overlapping_spans.append(line_number)
                break

    # ---------------- duplicates & leakage ----------------
    duplicate_text_groups = {
        text: occurrences
        for text, occurrences in text_index.items()
        if len(occurrences) > 1
    }
    duplicate_extra_records = sum(
        len(occurrences) - 1 for occurrences in duplicate_text_groups.values()
    )
    cross_split_leaks = [
        {"text_start": text[:80], "occurrences": occurrences}
        for text, occurrences in duplicate_text_groups.items()
        if len({occurrence["split"] for occurrence in occurrences}) > 1
    ]

    # Augmented records sharing an exact source text cannot be detected
    # without origin ids; report exact-text leakage only, honestly.
    augmented_lines = [
        item["line"]
        for item in records
        if isinstance(item["record"], dict)
        and item["record"].get("is_augmented") is True
    ]

    report = {
        "input_file": str(input_file),
        "total_lines_parsed": total_records,
        "malformed_lines": malformed_lines,
        "malformed_line_count": len(malformed_lines),
        "split_distribution": dict(split_counter),
        "is_augmented_distribution": dict(augmented_counter),
        "metadata_presence": dict(metadata_presence),
        "entity_counts": dict(label_counter),
        "total_entities": sum(label_counter.values()),
        "missing_text_lines": missing_text,
        "missing_entities_key_lines": missing_entities_key,
        "empty_entities_lines": empty_entities,
        "entities_not_a_list_lines": entity_not_list,
        "invalid_offset_lines": invalid_offsets,
        "empty_span_entities": empty_span_text,
        "unknown_label_entities": unknown_labels,
        "overlapping_span_lines": overlapping_spans,
        "duplicate_text_groups": len(duplicate_text_groups),
        "duplicate_extra_records": duplicate_extra_records,
        "cross_split_leak_groups": len(cross_split_leaks),
        "cross_split_leak_details": cross_split_leaks[:20],
        "augmented_record_count": len(augmented_lines),
        "notes": [
            "Labels are normalized case-insensitively; canonical space is "
            "HAZARD/ENERGY/BARRIER/ACTIVITY/EQUIPMENT/LOCATION.",
            "Augmented paraphrases of the same original report cannot be "
            "grouped without origin ids; only exact-text cross-split "
            "duplicates are reported as leakage.",
        ],
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2, ensure_ascii=False)

    # ---------------- console summary ----------------
    print()
    print("=" * 60)
    print("SIFguard NER dataset validation report")
    print("=" * 60)
    print(f"Input file          : {input_file}")
    print(f"Total records       : {total_records}")
    print(f"Malformed lines     : {len(malformed_lines)}")
    print(f"Split distribution  : {dict(split_counter)}")
    print(f"Augmented split     : {dict(augmented_counter)}")
    print()
    print("Entity counts:")
    for label in sorted(CANONICAL_LABELS):
        print(f"  {label:<10}: {label_counter.get(label, 0)}")
    print(f"  TOTAL     : {sum(label_counter.values())}")
    print()
    print("Quality checks:")
    print(f"  missing/blank text lines : {len(missing_text)}")
    print(f"  missing 'entities' key    : {len(missing_entities_key)}")
    print(f"  empty entity lists        : {len(empty_entities)}")
    print(f"  entities not a list       : {len(entity_not_list)}")
    print(f"  records w/ invalid offsets: {len(invalid_offsets)}")
    print(f"  empty-span entities       : {len(empty_span_text)}")
    print(f"  unknown-label entities    : {len(unknown_labels)}")
    print(f"  records w/ overlap spans  : {len(overlapping_spans)}")
    print(f"  duplicate text groups     : {len(duplicate_text_groups)} "
          f"(+{duplicate_extra_records} extra records)")
    print(f"  cross-split leak groups   : {len(cross_split_leaks)}")
    print()
    if label_counter:
        counts = sorted(label_counter.values())
        print(f"Class imbalance ratio (max/min): "
              f"{max(counts) / max(min(counts), 1):.1f}x")
        for label in ("ENERGY", "HAZARD", "BARRIER", "LOCATION"):
            print(f"  WARNING: {label} has only "
                  f"{label_counter.get(label, 0)} examples.")
    print()
    print(f"Full report written to: {REPORT_PATH}")

    # Non-zero exit only on structural problems that block training.
    blocking = (
        total_records == 0
        or len(missing_text) == total_records
        or sum(label_counter.values()) == 0
    )
    sys.exit(1 if blocking else 0)


if __name__ == "__main__":
    main()
