import json
from pathlib import Path

import numpy as np
from datasets import Dataset
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    DataCollatorForTokenClassification,
    Trainer,
    TrainingArguments,
)

from app.core.config import MAX_SEQUENCE_LENGTH
from app.ner.labels import LABEL2ID, ID2LABEL


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models" / "sif_distilbert"

TRAIN_FILE = DATA_DIR / "sifguard_ner_train.jsonl"
VAL_FILE = DATA_DIR / "sifguard_ner_val.jsonl"
TEST_FILE = DATA_DIR / "sifguard_ner_test.jsonl"

BASE_MODEL = "distilbert-base-uncased"


# ============================================================
# DATASET LOADING
# ============================================================

def load_jsonl(file_path: Path) -> list[dict]:
    if not file_path.exists():
        raise FileNotFoundError(
            f"Dataset file not found: {file_path}"
        )

    records = []

    with file_path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            line = line.strip()

            if not line:
                continue

            record = json.loads(line)

            if "tokens" not in record:
                raise ValueError(
                    f"Missing 'tokens' at line {line_number}"
                )

            if "ner_tags" not in record:
                raise ValueError(
                    f"Missing 'ner_tags' at line {line_number}"
                )

            if len(record["tokens"]) != len(record["ner_tags"]):
                raise ValueError(
                    f"Token/tag length mismatch at line {line_number}"
                )

            records.append(record)

    return records


# ============================================================
# LABEL VALIDATION
# ============================================================

def validate_labels(records: list[dict]) -> None:
    for record in records:
        for label in record["ner_tags"]:
            if label not in LABEL2ID:
                raise ValueError(
                    f"Unknown NER label: {label}"
                )


# ============================================================
# TOKENIZER
# ============================================================

def load_tokenizer():
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    return tokenizer


# ============================================================
# TOKENIZATION + BIO LABEL ALIGNMENT
# ============================================================

def tokenize_and_align_labels(
    records: list[dict],
    tokenizer
) -> Dataset:

    dataset = Dataset.from_list(records)

    def tokenize_batch(batch):

        tokenized = tokenizer(
            batch["tokens"],
            is_split_into_words=True,
            truncation=True,
            max_length=MAX_SEQUENCE_LENGTH,
            stride=50,
            return_overflowing_tokens=True
        )

        sample_mapping = tokenized.pop(
            "overflow_to_sample_mapping"
        )

        all_labels = []

        for chunk_index in range(
            len(tokenized["input_ids"])
        ):

            original_sample_index = sample_mapping[
                chunk_index
            ]

            labels = batch["ner_tags"][
                original_sample_index
            ]

            word_ids = tokenized.word_ids(
                batch_index=chunk_index
            )

            aligned_labels = []

            previous_word_id = None

            for word_id in word_ids:

                # Special tokens such as [CLS] and [SEP]
                if word_id is None:

                    aligned_labels.append(-100)

                    previous_word_id = None

                    continue

                current_label = labels[word_id]

                # First subword of a word
                if word_id != previous_word_id:

                    aligned_labels.append(
                        LABEL2ID[current_label]
                    )

                # Continuation subword
                else:

                    if current_label.startswith("B-"):

                        entity_type = current_label[2:]

                        continuation_label = (
                            f"I-{entity_type}"
                        )

                        aligned_labels.append(
                            LABEL2ID[continuation_label]
                        )

                    else:

                        aligned_labels.append(
                            LABEL2ID[current_label]
                        )

                previous_word_id = word_id

            all_labels.append(aligned_labels)

        tokenized["labels"] = all_labels

        return tokenized

    return dataset.map(
        tokenize_batch,
        batched=True,
        remove_columns=dataset.column_names
    )


# ============================================================
# MODEL
# ============================================================

def load_model():

    model = AutoModelForTokenClassification.from_pretrained(
        BASE_MODEL,
        num_labels=len(LABEL2ID),
        id2label=ID2LABEL,
        label2id=LABEL2ID
    )

    return model


# ============================================================
# METRICS
# ============================================================

def compute_metrics(eval_prediction):

    predictions, labels = eval_prediction

    predictions = np.argmax(
        predictions,
        axis=2
    )

    true_predictions = []
    true_labels = []

    for prediction_row, label_row in zip(
        predictions,
        labels
    ):

        current_predictions = []
        current_labels = []

        for prediction_id, label_id in zip(
            prediction_row,
            label_row
        ):

            # Ignore special tokens
            if label_id == -100:
                continue

            current_predictions.append(
                int(prediction_id)
            )

            current_labels.append(
                int(label_id)
            )

        true_predictions.extend(
            current_predictions
        )

        true_labels.extend(
            current_labels
        )

    if not true_labels:
        return {
            "accuracy": 0.0
        }

    correct = sum(
        prediction == label
        for prediction, label in zip(
            true_predictions,
            true_labels
        )
    )

    accuracy = correct / len(true_labels)

    return {
        "accuracy": accuracy
    }


# ============================================================
# MAIN TRAINING PIPELINE
# ============================================================

def main():

    print("=" * 60)
    print("SIFguard NER Training Pipeline - Stage 2")
    print("=" * 60)

    # --------------------------------------------------------
    # 1. Load datasets
    # --------------------------------------------------------

    print("\nLoading datasets...")

    train_records = load_jsonl(TRAIN_FILE)
    val_records = load_jsonl(VAL_FILE)

    print(
        f"Train records: {len(train_records)}"
    )

    print(
        f"Validation records: {len(val_records)}"
    )

    # --------------------------------------------------------
    # 2. Validate labels
    # --------------------------------------------------------

    print("\nValidating labels...")

    validate_labels(train_records)
    validate_labels(val_records)

    print("All labels are valid.")

    # --------------------------------------------------------
    # 3. Load tokenizer
    # --------------------------------------------------------

    print("\nLoading tokenizer...")

    tokenizer = load_tokenizer()

    print(
        f"Tokenizer loaded: {BASE_MODEL}"
    )

    # --------------------------------------------------------
    # 4. Tokenize datasets
    # --------------------------------------------------------

    print("\nTokenizing training dataset...")

    train_dataset = tokenize_and_align_labels(
        train_records,
        tokenizer
    )

    print(
        f"Tokenized training chunks: "
        f"{len(train_dataset)}"
    )

    print("\nTokenizing validation dataset...")

    val_dataset = tokenize_and_align_labels(
        val_records,
        tokenizer
    )

    print(
        f"Tokenized validation chunks: "
        f"{len(val_dataset)}"
    )

    # --------------------------------------------------------
    # 5. Load model
    # --------------------------------------------------------

    print("\nLoading DistilBERT model...")

    model = load_model()

    print(
        f"Model loaded with "
        f"{len(LABEL2ID)} labels."
    )

    # --------------------------------------------------------
    # 6. Data collator
    # --------------------------------------------------------

    data_collator = DataCollatorForTokenClassification(
        tokenizer=tokenizer
    )

    # --------------------------------------------------------
    # 7. Training configuration
    # --------------------------------------------------------

    print("\nConfiguring training...")

    training_args = TrainingArguments(
        output_dir=str(
            BASE_DIR / "models" / "training_output"
        ),

        eval_strategy="epoch",

        save_strategy="epoch",

        logging_strategy="steps",

        logging_steps=50,

        learning_rate=5e-5,

        per_device_train_batch_size=8,

        per_device_eval_batch_size=8,

        num_train_epochs=3,

        weight_decay=0.01,

        save_total_limit=2,

        load_best_model_at_end=True,

        metric_for_best_model="accuracy",

        greater_is_better=True,

        report_to="none",

        fp16=False,

        dataloader_num_workers=0,

        seed=42
    )

    # --------------------------------------------------------
    # 8. Trainer
    # --------------------------------------------------------

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics
    )

    # --------------------------------------------------------
    # 9. Start training
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("STARTING NER TRAINING")
    print("=" * 60)

    trainer.train()

    # --------------------------------------------------------
    # 10. Validation
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("VALIDATION RESULTS")
    print("=" * 60)

    evaluation_results = trainer.evaluate()

    for key, value in evaluation_results.items():

        if isinstance(value, float):
            print(
                f"{key}: {value:.4f}"
            )

        else:
            print(
                f"{key}: {value}"
            )

    # --------------------------------------------------------
    # 11. Save final model
    # --------------------------------------------------------

    print("\nSaving trained model...")

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    trainer.save_model(
        str(MODEL_DIR)
    )

    tokenizer.save_pretrained(
        str(MODEL_DIR)
    )

    print(
        f"Model saved to: {MODEL_DIR}"
    )

    # --------------------------------------------------------
    # 12. Finish
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("STAGE 2 TRAINING COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()