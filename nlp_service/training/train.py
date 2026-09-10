"""Fine-tune DistilBERT for SIFguard safety NER (token classification).

Task: NER only. Six entity types -> BIO label space (13 labels).
Reads dataset/processed/{train,validation}.json + labels.json produced by
prepare_dataset.py and saves the production model to
nlp_service/models/sif_distilbert/.

Imbalance handling: the dataset is severely imbalanced
(EQUIPMENT ~83x ENERGY), so training uses inverse-frequency class weights
in the token cross-entropy loss. Rare classes (ENERGY, HAZARD) are still
reported honestly in evaluation — weights help, they do not invent data.

Best-checkpoint selection uses entity-level micro-F1 on validation.

Reproducibility: fixed seed, saved training_config.json, label mapping
stored in the model config (id2label/label2id) AND labels.json.

Usage:
    SIFvenv\\Scripts\\python.exe nlp_service/training/train.py [--epochs 4]

No `datasets` / pyarrow dependency: plain JSON + torch Dataset.
"""

import argparse
import json
import random
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from nlp_service._compat import ensure_regex_shim  # noqa: E402

ensure_regex_shim()

import numpy as np  # noqa: E402
import torch  # noqa: E402
from torch.utils.data import Dataset  # noqa: E402
from transformers import (  # noqa: E402
    AutoModelForTokenClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    set_seed,
)

from nlp_service.training.ner_metrics import (  # noqa: E402
    ENTITY_TYPES,
    score_sequences,
)

BASE_MODEL = "distilbert-base-uncased"
# NOTE: `dataset/` (singular) — a top-level `datasets/` directory would
# shadow the Hugging Face `datasets` package and crash Trainer.
DATASET_DIR = PROJECT_ROOT / "dataset" / "processed"
OUTPUT_DIR = PROJECT_ROOT / "nlp_service" / "models" / "sif_distilbert"


class NERListDataset(Dataset):
    def __init__(self, encodings, label_sequences):
        self.encodings = encodings
        self.label_sequences = label_sequences

    def __len__(self):
        return len(self.label_sequences)

    def __getitem__(self, index):
        item = {
            key: torch.tensor(values[index])
            for key, values in self.encodings.items()
        }
        item["labels"] = torch.tensor(self.label_sequences[index])
        return item


def tokenize_and_align(tokenizer, batch_tokens, batch_tags, max_length):
    encodings = tokenizer(
        batch_tokens,
        truncation=True,
        max_length=max_length,
        is_split_into_words=True,
        padding=False,
    )
    aligned = []
    for example_index, tags in enumerate(batch_tags):
        word_ids = encodings.word_ids(batch_index=example_index)
        previous_word = None
        label_ids = []
        for word_id in word_ids:
            if word_id is None:
                label_ids.append(-100)
            elif word_id != previous_word:
                label_ids.append(tags[word_id])
            else:
                # Sub-word continuation: B-X -> I-X so spans stay valid.
                label_ids.append(tags[word_id])
            previous_word = word_id
        aligned.append(label_ids)
    return encodings, aligned


def pad_collator(tokenizer):
    pad_id = tokenizer.pad_token_id

    def collate(batch):
        max_len = max(len(item["input_ids"]) for item in batch)
        input_ids, attention_mask, labels = [], [], []
        for item in batch:
            pad_len = max_len - len(item["input_ids"])
            input_ids.append(
                torch.cat(
                    [item["input_ids"], torch.full((pad_len,), pad_id)]
                )
            )
            attention_mask.append(
                torch.cat(
                    [item["attention_mask"], torch.zeros(pad_len, dtype=torch.long)]
                )
            )
            labels.append(
                torch.cat(
                    [item["labels"], torch.full((pad_len,), -100)]
                )
            )
        return {
            "input_ids": torch.stack(input_ids),
            "attention_mask": torch.stack(attention_mask),
            "labels": torch.stack(labels),
        }

    return collate


class WeightedNERTrainer(Trainer):
    """Trainer with inverse-frequency class weights for imbalance."""

    def __init__(self, class_weights=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.class_weights = class_weights

    def compute_loss(
        self, model, inputs, return_outputs=False, num_items_in_batch=None
    ):
        labels = inputs.get("labels")
        outputs = model(
            input_ids=inputs.get("input_ids"),
            attention_mask=inputs.get("attention_mask"),
        )
        logits = outputs.get("logits")
        loss_fn = torch.nn.CrossEntropyLoss(
            weight=self.class_weights.to(logits.device)
            if self.class_weights is not None
            else None,
            ignore_index=-100,
        )
        loss = loss_fn(
            logits.view(-1, logits.shape[-1]), labels.view(-1)
        )
        return (loss, outputs) if return_outputs else loss


def build_compute_metrics(id2label):
    def compute_metrics(eval_pred):
        predictions, label_ids = eval_pred
        pred_ids = np.argmax(predictions, axis=2)
        true_sequences, pred_sequences = [], []
        for pred_row, label_row in zip(pred_ids, label_ids):
            true_tags, pred_tags = [], []
            for pred_id, label_id in zip(pred_row, label_row):
                if label_id == -100:
                    continue
                true_tags.append(id2label[int(label_id)])
                pred_tags.append(id2label[int(pred_id)])
            true_sequences.append(true_tags)
            pred_sequences.append(pred_tags)
        _, overall = score_sequences(true_sequences, pred_sequences)
        return {
            "entity_precision": overall["precision"],
            "entity_recall": overall["recall"],
            "entity_f1": overall["f1"],
        }

    return compute_metrics


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def main():
    parser = argparse.ArgumentParser(description="Fine-tune DistilBERT NER")
    parser.add_argument("--epochs", type=int, default=4)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--max-length", type=int, default=128)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    set_seed(args.seed)
    random.seed(args.seed)

    train_data = load_json(DATASET_DIR / "train.json")
    validation_data = load_json(DATASET_DIR / "validation.json")
    label_data = load_json(DATASET_DIR / "labels.json")
    labels = label_data["labels"]
    label2id = {label: index for index, label in enumerate(labels)}
    id2label = {index: label for index, label in enumerate(labels)}

    print(f"Train samples: {len(train_data)}")
    print(f"Validation samples: {len(validation_data)}")
    print(f"Labels ({len(labels)}): {labels}")
    print(f"Entity types: {ENTITY_TYPES}")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    train_enc, train_labels = tokenize_and_align(
        tokenizer,
        [item["tokens"] for item in train_data],
        [item["ner_tags"] for item in train_data],
        args.max_length,
    )
    val_enc, val_labels = tokenize_and_align(
        tokenizer,
        [item["tokens"] for item in validation_data],
        [item["ner_tags"] for item in validation_data],
        args.max_length,
    )

    # Inverse-frequency class weights (ignore O-weight explosion by capping).
    flat = [tag for seq in train_labels for tag in seq if tag != -100]
    counts = np.bincount(flat, minlength=len(labels)).astype(float)
    counts = np.maximum(counts, 1.0)
    weights = counts.sum() / (len(labels) * counts)
    # Keep the dominant O class from collapsing to zero influence, but
    # still let rare classes (ENERGY/HAZARD) count: cap ratio at 50x.
    weights = np.minimum(weights, weights[label2id["O"]] * 50)
    class_weights = torch.tensor(weights, dtype=torch.float)
    print("Class weights:", {
        label: round(float(class_weights[i]), 3)
        for i, label in enumerate(labels)
    })

    model = AutoModelForTokenClassification.from_pretrained(
        BASE_MODEL,
        num_labels=len(labels),
        id2label=id2label,
        label2id=label2id,
    )

    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        learning_rate=args.lr,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="entity_f1",
        greater_is_better=True,
        save_total_limit=2,
        logging_steps=50,
        seed=args.seed,
        report_to="none",
    )

    trainer = WeightedNERTrainer(
        class_weights=class_weights,
        model=model,
        args=training_args,
        train_dataset=NERListDataset(train_enc, train_labels),
        eval_dataset=NERListDataset(val_enc, val_labels),
        processing_class=tokenizer,
        data_collator=pad_collator(tokenizer),
        compute_metrics=build_compute_metrics(id2label),
    )

    started = time.time()
    trainer.train()
    elapsed = time.time() - started

    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    with open(DATASET_DIR / "labels.json", "r", encoding="utf-8") as handle:
        labels_payload = json.load(handle)
    with open(OUTPUT_DIR / "labels.json", "w", encoding="utf-8") as handle:
        json.dump(labels_payload, handle, indent=2)

    config = {
        "base_model": BASE_MODEL,
        "task": "token-classification (NER)",
        "entity_types": ENTITY_TYPES,
        "labels": labels,
        "train_samples": len(train_data),
        "validation_samples": len(validation_data),
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "learning_rate": args.lr,
        "max_length": args.max_length,
        "seed": args.seed,
        "class_weights": [float(value) for value in weights],
        "training_time_seconds": round(elapsed, 1),
        "best_metric": (
            trainer.state.best_metric
            if trainer.state.best_metric is not None
            else None
        ),
    }
    with open(OUTPUT_DIR / "training_config.json", "w", encoding="utf-8") as handle:
        json.dump(config, handle, indent=2)

    print()
    print("Training completed.")
    print(f"Model saved to: {OUTPUT_DIR}")
    print(f"Training time: {elapsed / 60:.1f} min")
    print(f"Best validation entity-F1: {trainer.state.best_metric}")


if __name__ == "__main__":
    main()
