from typing import List, Optional
import numpy as np
import torch

try:
    import shap

    SHAP_AVAILABLE = True

except ImportError:

    SHAP_AVAILABLE = False


# ============================================================
# CONFIGURATION
# ============================================================

DEFAULT_ENTITY_LABELS = [
    "HAZARD",
    "ACTIVITY",
    "LOCATION",
    "BARRIER_FAILURE",
]

MAX_LENGTH = 512

# Same chunk configuration as main.py
CHUNK_STRIDE = 64


# ============================================================
# HELPER
# ============================================================

def _create_chunks(
    text: str,
    tokenizer,
    max_length: int = MAX_LENGTH,
    stride: int = CHUNK_STRIDE,
) -> list:
    """
    Split a long document into overlapping chunks.

    This keeps the explainability module consistent
    with the NER pipeline in main.py.
    """

    if not text or not text.strip():

        return []


    encoded = tokenizer(

        text,

        add_special_tokens=True,

        truncation=True,

        max_length=max_length,

        stride=stride,

        return_overflowing_tokens=True,

        return_offsets_mapping=True,

        padding=False,

    )


    chunks = []


    for index in range(
        len(encoded["input_ids"])
    ):

        chunks.append({

            "input_ids": encoded[
                "input_ids"
            ][index],

            "attention_mask": encoded[
                "attention_mask"
            ][index],

            "offset_mapping": encoded[
                "offset_mapping"
            ][index],

        })


    return chunks


# ============================================================
# TOKEN CONFIDENCE
# ============================================================

def compute_token_confidence(
    text: str,
    tokenizer,
    ner_model,
    max_length: int = MAX_LENGTH,
    stride: int = CHUNK_STRIDE,
) -> List[dict]:
    """
    Calculate confidence for every predicted token.

    Unlike the old version, this supports long reports.

    Example:

        10,000 token report
                ↓
          multiple chunks
                ↓
        confidence for all chunks
    """

    if not text or not text.strip():

        return []


    chunks = _create_chunks(

        text,

        tokenizer,

        max_length=max_length,

        stride=stride,

    )


    all_evidence = []


    id2label = (
        ner_model.config.id2label
    )


    # --------------------------------------------------------
    # Process every chunk
    # --------------------------------------------------------

    for chunk_index, chunk in enumerate(
        chunks
    ):

        input_ids = torch.tensor(

            [chunk["input_ids"]],

            dtype=torch.long,

        )


        attention_mask = torch.tensor(

            [chunk["attention_mask"]],

            dtype=torch.long,

        )


        # ----------------------------------------------------
        # Model inference
        # ----------------------------------------------------

        with torch.no_grad():

            logits = ner_model(

                input_ids=input_ids,

                attention_mask=attention_mask,

            ).logits[0]


        probabilities = torch.softmax(
            logits,
            dim=-1
        )


        predictions = torch.argmax(
            probabilities,
            dim=-1
        )


        offsets = chunk[
            "offset_mapping"
        ]


        # ----------------------------------------------------
        # Token evidence
        # ----------------------------------------------------

        for index, prediction in enumerate(
            predictions
        ):

            if index >= len(offsets):

                continue


            start, end = offsets[index]


            # Ignore special tokens

            if start == end:

                continue


            label = id2label.get(

                prediction.item(),

                "O",

            )


            confidence = probabilities[
                index,
                prediction
            ].item()


            token_text = text[
                start:end
            ]


            if not token_text.strip():

                continue


            all_evidence.append({

                "token": token_text,

                "start": int(start),

                "end": int(end),

                "predicted_label": label,

                "confidence": round(
                    confidence,
                    4
                ),

                "chunk": (
                    chunk_index + 1
                ),

            })


    # --------------------------------------------------------
    # Remove duplicate token predictions
    #
    # Overlapping chunks can produce the same token
    # multiple times.
    # --------------------------------------------------------

    unique = {}

    for item in all_evidence:

        key = (

            item["start"],

            item["end"],

            item["predicted_label"],

        )


        # Keep the prediction with higher confidence

        if (

            key not in unique

            or item["confidence"]
            > unique[key]["confidence"]

        ):

            unique[key] = item


    result = list(
        unique.values()
    )


    result.sort(
        key=lambda item: (
            item["start"],
            item["end"],
        )
    )


    return result


# ============================================================
# MERGE TOKEN EVIDENCE
# ============================================================

def merge_token_evidence_to_entities(
    token_evidence: List[dict]
) -> List[dict]:
    """
    Convert BIO token predictions into complete entities.

    Example:

        B-ACTIVITY -> welding
        I-ACTIVITY -> activity

    becomes:

        ACTIVITY -> welding activity
    """

    if not token_evidence:

        return []


    # Sort by original document position

    token_evidence = sorted(

        token_evidence,

        key=lambda token: (

            token["start"],

            token["end"],

        ),

    )


    merged = []

    current = None


    for token in token_evidence:

        label = token[
            "predicted_label"
        ]


        # ----------------------------------------------------
        # Outside
        # ----------------------------------------------------

        if label == "O":

            if current is not None:

                merged.append(
                    current
                )

                current = None


            continue


        # ----------------------------------------------------
        # Invalid label protection
        # ----------------------------------------------------

        if len(label) < 3:

            continue


        prefix = label[:2]

        entity_type = label[2:]


        # ----------------------------------------------------
        # Beginning of entity
        # ----------------------------------------------------

        if (

            prefix == "B-"

            or current is None

            or current["label"]
            != entity_type

        ):

            if current is not None:

                merged.append(
                    current
                )


            current = {

                "text": token["token"],

                "label": entity_type,

                "start": token["start"],

                "end": token["end"],

                "token_evidence": [
                    token
                ],

            }


        # ----------------------------------------------------
        # Continuation of entity
        # ----------------------------------------------------

        else:

            current["text"] += (
                " "
                + token["token"]
            )


            current["end"] = (
                token["end"]
            )


            current[
                "token_evidence"
            ].append(
                token
            )


    # Final entity

    if current is not None:

        merged.append(
            current
        )


    # --------------------------------------------------------
    # Calculate entity confidence
    # --------------------------------------------------------

    for entity in merged:

        confidences = [

            token["confidence"]

            for token
            in entity["token_evidence"]

        ]


        if confidences:

            entity[
                "mean_confidence"
            ] = round(

                sum(confidences)
                / len(confidences),

                4,

            )


            entity[
                "min_confidence"
            ] = round(

                min(confidences),

                4,

            )


            entity[
                "max_confidence"
            ] = round(

                max(confidences),

                4,

            )


    return merged


# ============================================================
# FIND TARGET LABEL ID
# ============================================================

def _target_label_id(
    ner_model,
    label_suffix: str
) -> Optional[int]:
    """
    Find the model's label ID for a SIF entity.

    Example:

        HAZARD

    searches for:

        B-HAZARD
        I-HAZARD
    """

    id2label = (
        ner_model.config.id2label
    )


    # Prefer B-label

    for label_id, label in id2label.items():

        if label == f"B-{label_suffix}":

            return int(label_id)


    # Fallback to I-label

    for label_id, label in id2label.items():

        if label == f"I-{label_suffix}":

            return int(label_id)


    return None


# ============================================================
# SHAP PREDICTION FUNCTION
# ============================================================

def _make_predict_fn(
    tokenizer,
    ner_model,
    target_label_id: int,
    max_length: int = MAX_LENGTH,
):
    """
    Create prediction function used by SHAP.

    SHAP sends multiple masked versions of the text.
    The function returns the strongest probability
    that the target entity label exists.
    """

    def predict(texts):

        scores = []


        for text in texts:

            if not text or not text.strip():

                scores.append(
                    0.0
                )

                continue


            # ------------------------------------------------
            # Long text support
            # ------------------------------------------------

            chunks = _create_chunks(

                text,

                tokenizer,

                max_length=max_length,

                stride=CHUNK_STRIDE,

            )


            if not chunks:

                scores.append(
                    0.0
                )

                continue


            max_score = 0.0


            # ------------------------------------------------
            # Run model on every chunk
            # ------------------------------------------------

            for chunk in chunks:

                input_ids = torch.tensor(

                    [chunk["input_ids"]],

                    dtype=torch.long,

                )


                attention_mask = torch.tensor(

                    [chunk["attention_mask"]],

                    dtype=torch.long,

                )


                with torch.no_grad():

                    logits = ner_model(

                        input_ids=input_ids,

                        attention_mask=attention_mask,

                    ).logits[0]


                probabilities = torch.softmax(

                    logits,

                    dim=-1,

                )


                chunk_score = (

                    probabilities[
                        :,
                        target_label_id
                    ]

                    .max()

                    .item()

                )


                max_score = max(

                    max_score,

                    chunk_score,

                )


            scores.append(
                max_score
            )


        return np.array(
            scores
        )


    return predict


# ============================================================
# SHAP EVIDENCE
# ============================================================

def compute_shap_evidence(
    text: str,
    tokenizer,
    ner_model,
    label_suffix: str,
    max_evals: int = 100,
) -> dict:
    """
    Generate SHAP explanations for one SIF entity class.

    Example:

        HAZARD

    SHAP identifies which words contributed most
    toward the model predicting HAZARD.
    """

    # --------------------------------------------------------
    # Check SHAP installation
    # --------------------------------------------------------

    if not SHAP_AVAILABLE:

        return {

            "available": False,

            "reason": (
                "shap package is not installed. "
                "Run: pip install shap"
            ),

            "target_label": label_suffix,

            "tokens": [],

        }


    if not text or not text.strip():

        return {

            "available": False,

            "reason": (
                "No text was provided."
            ),

            "target_label": label_suffix,

            "tokens": [],

        }


    # --------------------------------------------------------
    # Find label ID
    # --------------------------------------------------------

    target_label_id = _target_label_id(

        ner_model,

        label_suffix,

    )


    if target_label_id is None:

        return {

            "available": False,

            "reason": (

                f"No B-/I- label found for "
                f"'{label_suffix}' in the "
                "model configuration."

            ),

            "target_label": label_suffix,

            "tokens": [],

        }


    try:

        # ----------------------------------------------------
        # Prediction function
        # ----------------------------------------------------

        predict_fn = _make_predict_fn(

            tokenizer,

            ner_model,

            target_label_id,

            max_length=MAX_LENGTH,

        )


        # ----------------------------------------------------
        # SHAP text masker
        # ----------------------------------------------------

        masker = shap.maskers.Text(
            tokenizer=tokenizer
        )


        # ----------------------------------------------------
        # SHAP explainer
        # ----------------------------------------------------

        explainer = shap.Explainer(

            predict_fn,

            masker,

        )


        # ----------------------------------------------------
        # Calculate SHAP values
        # ----------------------------------------------------

        shap_values = explainer(

            [text],

            max_evals=max_evals,

        )


        # ----------------------------------------------------
        # Extract words
        # ----------------------------------------------------

        words = shap_values.data[0]

        values = shap_values.values[0]


        tokens = []


        for word, value in zip(
            words,
            values
        ):

            if not str(word).strip():

                continue


            # SHAP can sometimes return
            # multi-dimensional values.

            if np.isscalar(value):

                shap_value = float(
                    value
                )

            else:

                shap_value = float(
                    np.asarray(value).reshape(-1)[0]
                )


            tokens.append({

                "token": str(word),

                "shap_value": round(
                    shap_value,
                    5
                ),

            })


        # Strongest evidence first

        tokens.sort(

            key=lambda item:
            abs(item["shap_value"]),

            reverse=True,

        )


        # ----------------------------------------------------
        # Base value
        # ----------------------------------------------------

        base_value = shap_values.base_values[0]


        if not np.isscalar(
            base_value
        ):

            base_value = np.asarray(
                base_value
            ).reshape(-1)[0]


        return {

            "available": True,

            "target_label": label_suffix,

            "base_value": round(
                float(base_value),
                5
            ),

            "tokens": tokens,

        }


    except Exception as error:

        return {

            "available": False,

            "reason": (
                f"SHAP calculation failed: "
                f"{str(error)}"
            ),

            "target_label": label_suffix,

            "tokens": [],

        }


# ============================================================
# COMPLETE REPORT EXPLANATION
# ============================================================

def explain_report(
    text: str,
    tokenizer,
    ner_model,
    entity_labels: List[str] = None,
    include_shap: bool = True,
    shap_max_evals: int = 100,
) -> dict:
    """
    Generate explainability information for
    the complete SIF report.

    Output includes:

        1. Token confidence
        2. Entity confidence
        3. Extracted entities
        4. SHAP evidence
    """

    if not text or not text.strip():

        return {

            "status": "success",

            "entities": [],

            "token_evidence": [],

            "shap_evidence_by_label": {},

        }


    # --------------------------------------------------------
    # Default labels
    # --------------------------------------------------------

    if entity_labels is None:

        entity_labels = (
            DEFAULT_ENTITY_LABELS
        )


    # --------------------------------------------------------
    # Token-level confidence
    # --------------------------------------------------------

    token_evidence = (
        compute_token_confidence(

            text,

            tokenizer,

            ner_model,

            max_length=MAX_LENGTH,

            stride=CHUNK_STRIDE,

        )
    )


    # --------------------------------------------------------
    # Entity-level evidence
    # --------------------------------------------------------

    entities = (
        merge_token_evidence_to_entities(
            token_evidence
        )
    )


    # --------------------------------------------------------
    # SHAP
    # --------------------------------------------------------

    shap_by_label = {}


    if include_shap:

        for label in entity_labels:

            shap_by_label[label] = (
                compute_shap_evidence(

                    text,

                    tokenizer,

                    ner_model,

                    label,

                    max_evals=shap_max_evals,

                )
            )


    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    entity_counts = {

        "HAZARD": 0,

        "ACTIVITY": 0,

        "LOCATION": 0,

        "BARRIER_FAILURE": 0,

    }


    for entity in entities:

        label = entity[
            "label"
        ].upper()


        if label in entity_counts:

            entity_counts[label] += 1


    return {

        "status": "success",

        "entities": entities,

        "token_evidence": token_evidence,

        "entity_counts": entity_counts,

        "shap_evidence_by_label": (
            shap_by_label
        ),

    }
