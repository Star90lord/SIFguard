"""SIFguard NER dataset preparation.

Converts raw character-span annotations into token-level BIO tags for
DistilBERT token classification and writes reproducible
train / validation / test splits.

Input : dataset/sif_ner_dataset (1).jsonl  (fallback: dataset/sif_ner_dataset.jsonl)
Output: dataset/processed/{train,validation,test}.json + labels.json

Key behaviours:
  * Canonical label space is UPPERCASE
    (HAZARD/ENERGY/BARRIER/ACTIVITY/EQUIPMENT/LOCATION) matching the
    annotated dataset and the project spec.
  * The existing `split` field is respected when valid. Only records with a
    missing/invalid split are assigned (80/10/10, seed 42).
  * Exact-duplicate texts that leak across splits are repaired
    deterministically: every member of a duplicated-text group is moved to
    the group's majority split (train wins ties), so no text appears in two
    splits. Repairs are reported, never silent.
  * Invalid entities (bad offsets, unknown labels, empty spans) are skipped
    per-entity and counted in the console report.

Usage:
    SIFvenv\\Scripts\\python.exe nlp_service/training/prepare_dataset.py
"""

import json
import random
from collections import Counter, defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

CANDIDATE_INPUTS = [
    PROJECT_ROOT / "dataset" / "sif_ner_dataset (1).jsonl",
    PROJECT_ROOT / "dataset" / "sif_ner_dataset.jsonl",
]

# NOTE: outputs intentionally live under `dataset/` (singular). A top-level
# `datasets/` directory would shadow the Hugging Face `datasets` package
# and crash transformers.Trainer.
OUTPUT_DIR = PROJECT_ROOT / "dataset" / "processed"

ENTITY_LABELS = [
    "HAZARD",
    "ENERGY",
    "BARRIER",
    "ACTIVITY",
    "EQUIPMENT",
    "LOCATION",
]

LABELS = ["O"]
for _entity_label in ENTITY_LABELS:
    LABELS.append(f"B-{_entity_label}")
    LABELS.append(f"I-{_entity_label}")

LABEL2ID = {label: index for index, label in enumerate(LABELS)}

VALID_SPLITS = ("train", "validation", "test")
RANDOM_SEED = 42


def find_input():
    for candidate in CANDIDATE_INPUTS:
        if candidate.is_file():
            return candidate
    return None


def normalize_label(raw_label):
    """Map any-case dataset labels onto the canonical uppercase space."""
    label = str(raw_label or "").strip().upper()
    return label if label in ENTITY_LABELS else None


def validate_entity(text, start, end, label):
    if not isinstance(start, int) or not isinstance(end, int):
        return False
    if start < 0 or end > len(text) or start >= end:
        return False
    if label not in ENTITY_LABELS:
        return False
    if not text[start:end].strip():
        return False
    return True


def tokenize_with_offsets(text):
    """Whitespace tokenization with exact character offsets.

    Uses str.find scanning forward from the previous token end so repeated
    words resolve to the correct occurrence.
    """
    tokens = []
    offsets = []
    cursor = 0
    for word in text.split():
        start = text.find(word, cursor)
        if start == -1:  # should not happen; fail safe
            continue
        end = start + len(word)
        tokens.append(word)
        offsets.append((start, end))
        cursor = end
    return tokens, offsets


def create_labels(text, entities, skipped_counter):
    tokens, offsets = tokenize_with_offsets(text)
    labels = ["O"] * len(tokens)

    for entity in entities:
        if not isinstance(entity, dict):
            skipped_counter["malformed_entity"] += 1
            continue
        label = normalize_label(entity.get("label"))
        start = entity.get("start")
        end = entity.get("end")
        if not validate_entity(text, start, end, label):
            skipped_counter["invalid_entity"] += 1
            continue

        matching = [
            index
            for index, (token_start, token_end) in enumerate(offsets)
            if token_start < end and token_end > start
        ]
        if not matching:
            skipped_counter["no_token_overlap"] += 1
            continue

        # If a token was already claimed by an earlier (overlapping) entity,
        # keep the first claim and count the collision instead of corrupting
        # the BIO sequence. (The validator confirms the raw data has no
        # overlaps; this is defence in depth.)
        first = True
        for token_index in matching:
            if labels[token_index] != "O":
                skipped_counter["token_collision"] += 1
                continue
            labels[token_index] = (
                f"B-{label}" if first else f"I-{label}"
            )
            first = False

    return {
        "tokens": tokens,
        "ner_tags": [LABEL2ID[label] for label in labels],
    }


def load_records(input_file):
    records = []
    with open(input_file, "r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as error:
                print(f"Skipping line {line_number}: {error}")
                continue
            if not isinstance(record, dict) or not str(
                record.get("text", "")
            ).strip():
                print(f"Skipping line {line_number}: missing text")
                continue
            if not isinstance(record.get("entities", []), list):
                print(f"Skipping line {line_number}: entities not a list")
                continue
            records.append(record)
    return records


def repair_cross_split_leakage(records):
    """Move every exact-duplicate text group into a single split.

    Returns the number of records whose split was reassigned.
    """
    groups = defaultdict(list)
    for record in records:
        groups[record["text"].strip().lower()].append(record)

    repaired = 0
    for members in groups.values():
        splits = {member.get("split") for member in members}
        if len(splits) <= 1:
            continue
        # Majority split wins; ties resolve to train > validation > test.
        counts = Counter(member.get("split") for member in members)
        preference = {"train": 0, "validation": 1, "test": 2}
        target = sorted(
            counts.items(), key=lambda item: (-item[1], preference.get(item[0], 9))
        )[0][0]
        if target not in VALID_SPLITS:
            target = "train"
        for member in members:
            if member.get("split") != target:
                member["split"] = target
                repaired += 1
    return repaired


def assign_missing_splits(records):
    """Assign 80/10/10 (seed 42) only to records without a valid split."""
    rng = random.Random(RANDOM_SEED)
    assigned = 0
    for record in records:
        if record.get("split") not in VALID_SPLITS:
            roll = rng.random()
            if roll < 0.8:
                record["split"] = "train"
            elif roll < 0.9:
                record["split"] = "validation"
            else:
                record["split"] = "test"
            assigned += 1
    return assigned


def main():
    input_file = find_input()
    if input_file is None:
        raise FileNotFoundError(
            "NER dataset not found. Checked: "
            + ", ".join(str(path) for path in CANDIDATE_INPUTS)
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    records = load_records(input_file)
    if len(records) < 10:
        raise ValueError("Dataset is too small for training.")

    repaired = repair_cross_split_leakage(records)
    assigned = assign_missing_splits(records)

    skipped_counter = Counter()
    entity_counter = Counter()
    splits = {"train": [], "validation": [], "test": []}

    for record in records:
        converted = create_labels(
            record["text"], record.get("entities", []), skipped_counter
        )
        for tag_id in converted["ner_tags"]:
            entity_counter[LABELS[tag_id]] += 1
        splits[record["split"]].append(converted)

    for name in ("train", "validation", "test"):
        if not splits[name]:
            raise ValueError(f"Split '{name}' is empty after preparation.")

    for filename, key in (
        ("train.json", "train"),
        ("validation.json", "validation"),
        ("test.json", "test"),
    ):
        with open(OUTPUT_DIR / filename, "w", encoding="utf-8") as handle:
            json.dump(splits[key], handle, ensure_ascii=False)

    with open(OUTPUT_DIR / "labels.json", "w", encoding="utf-8") as handle:
        json.dump({"labels": LABELS, "label2id": LABEL2ID}, handle, indent=2)

    total = sum(len(items) for items in splits.values())
    print()
    print("Dataset preparation completed.")
    print(f"Input: {input_file}")
    print(f"Total: {total}")
    print(f"Train: {len(splits['train'])}")
    print(f"Validation: {len(splits['validation'])}")
    print(f"Test: {len(splits['test'])}")
    print(f"Cross-split duplicates repaired: {repaired}")
    print(f"Missing splits assigned (80/10/10, seed 42): {assigned}")
    print(f"Skipped entities: {dict(skipped_counter) or 'none'}")
    print("Token-level tag distribution (train split):")
    train_tags = Counter()
    for item in splits["train"]:
        train_tags.update(LABELS[tag_id] for tag_id in item["ner_tags"])
    for label in LABELS:
        print(f"  {label:<12}: {train_tags.get(label, 0)}")


if __name__ == "__main__":
    main()
