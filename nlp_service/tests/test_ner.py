import json
from pathlib import Path

import numpy as np
from datasets import Dataset
from seqeval.metrics import (
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"

TEST_FILE = DATA_DIR / "sifguard_ner_test.jsonl"

MODEL_DIR = (
    BASE_DIR
    / "models"
    / "sif_distilbert"
)


# ============================================================
# LABELS
# ============================================================

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
    "I-Location",
]


ID2LABEL = {
    index: label
    for index, label in enumerate(LABELS)
}


# ============================================================
# DATASET LOADING
# ============================================================

def load_jsonl(file_path: Path) -> list[dict]:

    if not file_path.exists():
        raise FileNotFoundError(
            f"Test dataset not found: {file_path}"
        )

    records = []

    with file_path.open(
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

            record = json.loads(line)

            if "tokens" not in record:
                raise ValueError(
                    f"Missing tokens at line {line_number}"
                )

            if "ner_tags" not in record:
                raise ValueError(
                    f"Missing ner_tags at line {line_number}"
                )

            if len(record["tokens"]) != len(
                record["ner_tags"]
            ):
                raise ValueError(
                    f"Token/tag mismatch at line "
                    f"{line_number}"
                )

            records.append(record)

    return records


# ============================================================
# TOKENIZATION + LABEL ALIGNMENT
# ============================================================

def prepare_dataset(
    records: list[dict],
    tokenizer
) -> Dataset:

    dataset = Dataset.from_list(records)

    def tokenize_batch(batch):

        tokenized = tokenizer(
            batch["tokens"],
            is_split_into_words=True,
            truncation=True,
            max_length=512,
            stride=50,
            return_overflowing_tokens=True
        )

        sample_mapping = tokenized.pop(
            "overflow_to_sample_mapping"
        )

        aligned_labels = []

        for chunk_index in range(
            len(tokenized["input_ids"])
        ):

            sample_index = sample_mapping[
                chunk_index
            ]

            labels = batch["ner_tags"][
                sample_index
            ]

            word_ids = tokenized.word_ids(
                batch_index=chunk_index
            )

            chunk_labels = []

            previous_word_id = None

            for word_id in word_ids:

                # [CLS], [SEP], padding, etc.
                if word_id is None:

                    chunk_labels.append(
                        -100
                    )

                    previous_word_id = None

                    continue

                current_label = labels[word_id]

                # First subword
                if word_id != previous_word_id:

                    chunk_labels.append(
                        LABELS.index(
                            current_label
                        )
                    )

                # Continuation subword
                else:

                    if current_label.startswith(
                        "B-"
                    ):

                        entity_type = (
                            current_label[2:]
                        )

                        continuation_label = (
                            f"I-{entity_type}"
                        )

                        chunk_labels.append(
                            LABELS.index(
                                continuation_label
                            )
                        )

                    else:

                        chunk_labels.append(
                            LABELS.index(
                                current_label
                            )
                        )

                previous_word_id = word_id

            aligned_labels.append(
                chunk_labels
            )

        tokenized["labels"] = aligned_labels

        return tokenized

    return dataset.map(
        tokenize_batch,
        batched=True,
        remove_columns=dataset.column_names
    )


# ============================================================
# CONVERT IDS TO LABELS
# ============================================================

def convert_to_labels(
    predictions,
    labels
):

    predicted_sequences = []
    true_sequences = []

    for prediction_row, label_row in zip(
        predictions,
        labels
    ):

        predicted_labels = []
        true_labels = []

        for prediction_id, label_id in zip(
            prediction_row,
            label_row
        ):

            # Ignore special tokens
            if label_id == -100:
                continue

            predicted_labels.append(
                ID2LABEL[
                    int(prediction_id)
                ]
            )

            true_labels.append(
                ID2LABEL[
                    int(label_id)
                ]
            )

        predicted_sequences.append(
            predicted_labels
        )

        true_sequences.append(
            true_labels
        )

    return predicted_sequences, true_sequences


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("SIFguard NER - Stage 3 Test Evaluation")
    print("=" * 60)

    # --------------------------------------------------------
    # 1. Check model
    # --------------------------------------------------------

    if not MODEL_DIR.exists():

        raise FileNotFoundError(
            f"Trained model not found: {MODEL_DIR}"
        )

    print("\nLoading trained model...")

    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_DIR
    )

    model = AutoModelForTokenClassification.from_pretrained(
        MODEL_DIR
    )

    print("Trained model loaded successfully.")

    # --------------------------------------------------------
    # 2. Load test data
    # --------------------------------------------------------

    print("\nLoading test dataset...")

    records = load_jsonl(TEST_FILE)

    print(
        f"Test records: {len(records)}"
    )

    # --------------------------------------------------------
    # 3. Prepare dataset
    # --------------------------------------------------------

    print("\nTokenizing test dataset...")

    test_dataset = prepare_dataset(
        records,
        tokenizer
    )

    print(
        f"Test chunks: {len(test_dataset)}"
    )

    # --------------------------------------------------------
    # 4. Run predictions
    # --------------------------------------------------------

    print("\nRunning model predictions...")

    import torch

    device = torch.device(
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )

    model.to(device)
    model.eval()

    all_predictions = []
    all_labels = []

    for index in range(
        len(test_dataset)
    ):

        item = test_dataset[index]

        input_ids = torch.tensor(
            [item["input_ids"]],
            dtype=torch.long
        ).to(device)

        attention_mask = torch.tensor(
            [item["attention_mask"]],
            dtype=torch.long
        ).to(device)

        with torch.no_grad():

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask
            )

        predictions = torch.argmax(
            outputs.logits,
            dim=-1
        )[0].cpu().numpy()

        labels = np.array(
            item["labels"]
        )

        all_predictions.append(
            predictions
        )

        all_labels.append(
            labels
        )

    # --------------------------------------------------------
    # 5. Convert to BIO labels
    # --------------------------------------------------------

    print("\nConverting predictions...")

    predicted_sequences, true_sequences = (
        convert_to_labels(
            all_predictions,
            all_labels
        )
    )

    # --------------------------------------------------------
    # 6. Calculate metrics
    # --------------------------------------------------------

    precision = precision_score(
        true_sequences,
        predicted_sequences
    )

    recall = recall_score(
        true_sequences,
        predicted_sequences
    )

    f1 = f1_score(
        true_sequences,
        predicted_sequences
    )

    # --------------------------------------------------------
    # 7. Print overall metrics
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("OVERALL NER RESULTS")
    print("=" * 60)

    print(
        f"Precision : {precision:.4f}"
    )

    print(
        f"Recall    : {recall:.4f}"
    )

    print(
        f"F1 Score  : {f1:.4f}"
    )

    # --------------------------------------------------------
    # 8. Detailed classification report
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("PER-ENTITY RESULTS")
    print("=" * 60)

    report = classification_report(
        true_sequences,
        predicted_sequences
    )

    print(report)

    print("=" * 60)
    print("STAGE 3 EVALUATION COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()