"""Production NER inference for the fine-tuned SIFguard DistilBERT model.

Loads nlp_service/models/sif_distilbert (model + tokenizer + label mapping
from training) and converts token predictions into character-offset entities
with real softmax confidence scores.

Label mapping is NEVER hard-coded here: it comes from model.config.id2label
written at training time.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from nlp_service._compat import ensure_regex_shim  # noqa: E402

ensure_regex_shim()

import torch  # noqa: E402
from transformers import (  # noqa: E402
    AutoModelForTokenClassification,
    AutoTokenizer,
)

MODEL_PATH = PROJECT_ROOT / "nlp_service" / "models" / "sif_distilbert"
MAX_LENGTH = 512

_model = None
_tokenizer = None
_id_to_label = None
_load_error = None


def is_model_available():
    """True when a trained model directory exists on disk."""
    return MODEL_PATH.is_dir() and (MODEL_PATH / "config.json").is_file()


def get_load_error():
    return _load_error


def _load():
    global _model, _tokenizer, _id_to_label, _load_error
    if _model is not None:
        return True
    if not is_model_available():
        _load_error = (
            f"Trained NER model not found at {MODEL_PATH}. "
            "Run nlp_service/training/train.py first."
        )
        return False
    try:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        _model = AutoModelForTokenClassification.from_pretrained(MODEL_PATH)
        _model.eval()
        _id_to_label = dict(_model.config.id2label)
        # JSON keys are strings; normalize to int for lookup safety.
        _id_to_label = {int(key): value for key, value in _id_to_label.items()}
        return True
    except Exception as error:  # fail gracefully, never crash the service
        _load_error = f"Failed to load NER model: {error}"
        _model = None
        return False


def _softmax_confidence(logits_row, label_id):
    probabilities = torch.softmax(logits_row, dim=-1)
    return float(probabilities[label_id].item())


def predict(text):
    """Run NER inference on raw safety-report text.

    Returns a list of:
        {"text": ..., "label": "EQUIPMENT"|..., "start": int,
         "end": int, "confidence": 0.0-1.0}

    Raises RuntimeError when no trained model is available.
    """
    if not text or not str(text).strip():
        return []
    text = str(text)

    if not _load():
        raise RuntimeError(get_load_error())

    inputs = _tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LENGTH,
        return_offsets_mapping=True,
    )
    offset_mapping = inputs.pop("offset_mapping")[0].tolist()

    with torch.no_grad():
        outputs = _model(**inputs)

    logits = outputs.logits[0]
    predictions = torch.argmax(logits, dim=-1).tolist()

    entities = []
    current = None

    def flush():
        if current is not None:
            entities.append(current)

    for index, pred_id in enumerate(predictions):
        label = _id_to_label.get(int(pred_id), "O")
        start, end = offset_mapping[index]
        if label == "O" or "-" not in label or start == end:
            if label == "O":
                flush()
                current = None
            continue

        prefix, entity_type = label.split("-", 1)
        confidence = _softmax_confidence(logits[index], int(pred_id))

        if prefix == "B" or current is None or current["label"] != entity_type:
            flush()
            current = {
                "label": entity_type,
                "text": text[start:end],
                "start": int(start),
                "end": int(end),
                "confidence": confidence,
            }
        else:  # I- continuation of the same entity
            current["text"] = text[current["start"]:int(end)]
            current["end"] = int(end)
            current["confidence"] = min(current["confidence"], confidence)

    flush()
    return entities


def entities_by_type(entities):
    """Group flat entity list into {Hazard: [...], Energy: [...], ...}."""
    grouped = {}
    for entity in entities:
        label = str(entity.get("label", "")).upper()
        key = label.capitalize()  # Hazard, Energy, ... (risk-engine format)
        grouped.setdefault(key, []).append(entity.get("text", ""))
    return grouped


class SIFNER:
    """Stateful wrapper kept for backward compatibility.

    Loads lazily: constructing SIFNER never raises when the model file is
    missing; predict() raises RuntimeError with a clear message instead.
    """

    def __init__(self):
        self._ready = _load()

    @property
    def id_to_label(self):
        _load()
        return dict(_id_to_label) if _id_to_label else {}

    def predict(self, text):
        entities = predict(text)
        # Legacy shape (no confidence) + new fields preserved.
        return [
            {
                "text": entity["text"],
                "label": entity["label"],
                "start": entity["start"],
                "end": entity["end"],
                "confidence": entity["confidence"],
            }
            for entity in entities
        ]
