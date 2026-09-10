"""Evaluate the fine-tuned SIFguard DistilBERT NER model.

Reports strict entity-level precision / recall / F1 overall AND per
entity class (HAZARD/ENERGY/BARRIER/ACTIVITY/EQUIPMENT/LOCATION), plus
token accuracy for reference. Token accuracy alone is misleading because
`O` dominates — entity F1 is the primary metric.

Saves dataset/processed/eval_metrics.json.

Usage:
    SIFvenv\\Scripts\\python.exe nlp_service/training/evaluate.py
"""

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from nlp_service._compat import ensure_regex_shim  # noqa: E402

ensure_regex_shim()

import torch  # noqa: E402
from transformers import AutoModelForTokenClassification, AutoTokenizer  # noqa: E402

from nlp_service.training.ner_metrics import score_sequences  # noqa: E402

MODEL_DIR = PROJECT_ROOT / "nlp_service" / "models" / "sif_distilbert"
# NOTE: `dataset/` (singular) — see train.py.
DATASET_DIR = PROJECT_ROOT / "dataset" / "processed"
METRICS_PATH = DATASET_DIR / "eval_metrics.json"
MAX_LENGTH = 128


def word_level_tags(tokenizer, model, tokens, id2label):
    """Predict one BIO tag per input word (first sub-word wins)."""
    encoding = tokenizer(
        tokens,
        is_split_into_words=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt",
    )
    word_ids = encoding.word_ids(batch_index=0)
    with torch.no_grad():
        logits = model(
            input_ids=encoding["input_ids"],
            attention_mask=encoding["attention_mask"],
        ).logits[0]
    pred_ids = torch.argmax(logits, dim=-1).tolist()

    tags = []
    previous_word = None
    for word_id, pred_id in zip(word_ids, pred_ids):
        if word_id is None or word_id == previous_word:
            continue
        tags.append(id2label[int(pred_id)])
        previous_word = word_id
    return tags


def main():
    if not MODEL_DIR.is_dir():
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_DIR}. Run train.py first."
        )

    with open(DATASET_DIR / "test.json", "r", encoding="utf-8") as handle:
        test_data = json.load(handle)
    with open(DATASET_DIR / "labels.json", "r", encoding="utf-8") as handle:
        labels = json.load(handle)["labels"]
    id2label = {index: label for index, label in enumerate(labels)}

    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForTokenClassification.from_pretrained(MODEL_DIR)
    model.eval()

    true_sequences, pred_sequences = [], []
    correct_tokens, total_tokens = 0, 0

    for item in test_data:
        true_tags = [labels[tag_id] for tag_id in item["ner_tags"]]
        pred_tags = word_level_tags(tokenizer, model, item["tokens"], id2label)
        # Truncation guard: compare over the overlapping prefix only.
        length = min(len(true_tags), len(pred_tags))
        true_sequences.append(true_tags[:length])
        pred_sequences.append(pred_tags[:length])
        for true_tag, pred_tag in zip(
            true_tags[:length], pred_tags[:length]
        ):
            total_tokens += 1
            if true_tag == pred_tag:
                correct_tokens += 1

    per_type, overall = score_sequences(true_sequences, pred_sequences)
    token_accuracy = correct_tokens / total_tokens if total_tokens else 0.0

    result = {
        "test_samples": len(test_data),
        "token_accuracy": round(token_accuracy, 4),
        "overall": {
            key: round(value, 4)
            if isinstance(value, float)
            else value
            for key, value in overall.items()
        },
        "per_entity": {
            entity: {
                key: round(value, 4)
                if isinstance(value, float)
                else value
                for key, value in metrics.items()
            }
            for entity, metrics in per_type.items()
        },
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2)

    print()
    print("Evaluation completed.")
    print(f"Test samples   : {len(test_data)}")
    print(f"Token accuracy : {token_accuracy:.4f}  (O-dominated, reference only)")
    print()
    print(f"{'Entity':<12}{'Precision':>10}{'Recall':>10}{'F1':>10}"
          f"{'Support':>10}")
    print("-" * 52)
    for entity, metrics in per_type.items():
        if entity.startswith("_"):
            continue
        print(
            f"{entity:<12}{metrics['precision']:>10.4f}"
            f"{metrics['recall']:>10.4f}{metrics['f1']:>10.4f}"
            f"{metrics['actual']:>10}"
        )
    print("-" * 52)
    print(
        f"{'OVERALL':<12}{overall['precision']:>10.4f}"
        f"{overall['recall']:>10.4f}{overall['f1']:>10.4f}"
        f"{overall['support']:>10}"
    )
    print()
    print(f"Metrics saved to: {METRICS_PATH}")


if __name__ == "__main__":
    main()
