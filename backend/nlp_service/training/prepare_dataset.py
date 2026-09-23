import json
import random
from pathlib import Path


INPUT_FILE = Path("datasets/sif_ner_dataset.jsonl")
OUTPUT_DIR = Path("datasets/processed")

ENTITY_LABELS = [
    "Hazard",
    "Energy",
    "Barrier",
    "Activity",
    "Equipment",
    "Location",
]

LABELS = ["O"]

for entity_label in ENTITY_LABELS:
    LABELS.append(f"B-{entity_label}")
    LABELS.append(f"I-{entity_label}")

LABEL2ID = {
    label: index
    for index, label in enumerate(LABELS)
}


def validate_entity(text, entity):
    start = entity.get("start")
    end = entity.get("end")
    label = entity.get("label")

    if not isinstance(start, int):
        return False

    if not isinstance(end, int):
        return False

    if start < 0 or end > len(text):
        return False

    if start >= end:
        return False

    if label not in ENTITY_LABELS:
        return False

    if not text[start:end].strip():
        return False

    return True


def tokenize_text(text):
    tokens = []
    offsets = []

    for index, word in enumerate(text.split()):
        start = text.find(
            word,
            0 if index == 0 else offsets[-1][1]
        )

        end = start + len(word)

        tokens.append(word)
        offsets.append((start, end))

    return tokens, offsets


def create_labels(text, entities):
    tokens, offsets = tokenize_text(text)

    labels = ["O"] * len(tokens)

    for entity in entities:

        if not validate_entity(text, entity):
            continue

        entity_start = entity["start"]
        entity_end = entity["end"]
        entity_label = entity["label"]

        matching_tokens = []

        for index, (token_start, token_end) in enumerate(offsets):

            overlap = (
                token_start < entity_end
                and token_end > entity_start
            )

            if overlap:
                matching_tokens.append(index)

        if not matching_tokens:
            continue

        first = True

        for token_index in matching_tokens:

            if first:
                labels[token_index] = (
                    f"B-{entity_label}"
                )
                first = False

            else:
                labels[token_index] = (
                    f"I-{entity_label}"
                )

    return {
        "tokens": tokens,
        "ner_tags": [
            LABEL2ID[label]
            for label in labels
        ],
    }


def load_dataset():
    records = []

    with open(
        INPUT_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        for line_number, line in enumerate(
            file,
            start=1
        ):

            line = line.strip()

            if not line:
                continue

            try:
                record = json.loads(line)

            except json.JSONDecodeError as error:
                print(
                    f"Skipping line {line_number}: "
                    f"{error}"
                )
                continue

            if "text" not in record:
                print(
                    f"Skipping line {line_number}: "
                    "missing text"
                )
                continue

            records.append(record)

    return records


def main():

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    records = load_dataset()

    random.seed(42)
    random.shuffle(records)

    processed = []

    for record in records:

        result = create_labels(
            record["text"],
            record.get("entities", [])
        )

        processed.append(result)

    total = len(processed)

    if total < 10:
        raise ValueError(
            "Dataset is too small for training."
        )

    train_end = int(total * 0.8)
    validation_end = int(total * 0.9)

    splits = {
        "train.json": processed[:train_end],
        "validation.json": processed[
            train_end:validation_end
        ],
        "test.json": processed[
            validation_end:
        ],
    }

    for filename, data in splits.items():

        output_file = OUTPUT_DIR / filename

        with open(
            output_file,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                data,
                file,
                indent=2,
                ensure_ascii=False
            )

    labels_file = OUTPUT_DIR / "labels.json"

    with open(
        labels_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            {
                "labels": LABELS,
                "label2id": LABEL2ID
            },
            file,
            indent=2
        )

    print()
    print("Dataset preparation completed.")
    print(f"Total: {total}")
    print(f"Train: {len(splits['train.json'])}")
    print(
        f"Validation: "
        f"{len(splits['validation.json'])}"
    )
    print(f"Test: {len(splits['test.json'])}")


if __name__ == "__main__":
    main()