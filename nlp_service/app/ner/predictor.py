from typing import Any

import torch


# --------------------------------------------------
# Prediction
# --------------------------------------------------

def predict_tokens(
    text: str,
    tokenizer: Any,
    model: Any,
    device: torch.device,
    max_length: int = 512
) -> list[dict]:
    """
    Run NER prediction on a single piece of text.

    Returns one prediction record for each token.
    """

    if not isinstance(text, str):
        raise TypeError("text must be a string.")

    if not text.strip():
        return []

    encoded = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=max_length
    )

    encoded = {
        key: value.to(device)
        for key, value in encoded.items()
    }

    with torch.no_grad():
        outputs = model(**encoded)

    predictions = torch.argmax(
        outputs.logits,
        dim=-1
    )[0]

    input_ids = encoded["input_ids"][0]

    tokens = tokenizer.convert_ids_to_tokens(
        input_ids
    )

    results = []

    for token, prediction_id in zip(
        tokens,
        predictions.tolist()
    ):
        label = model.config.id2label.get(
            prediction_id,
            "O"
        )

        results.append({
            "token": token,
            "label": label
        })

    return results

def extract_entities(
    predictions: list[dict]
) -> list[dict]:
    """
    Convert BIO token predictions into structured entities.

    Also reconstruct WordPiece subword tokens such as:
    "isol", "##ation" -> "isolation"
    """

    entities = []

    current_tokens = []
    current_label = None

    def build_entity(tokens: list[str], label: str) -> dict:
        """
        Reconstruct token pieces into readable entity text.
        """

        text = ""

        for token in tokens:
            if token.startswith("##"):
                text += token[2:]
            else:
                if text:
                    text += " "

                text += token

        return {
            "text": text,
            "label": label
        }

    for prediction in predictions:
        token = prediction["token"]
        label = prediction["label"]

        # Ignore special tokenizer tokens.
        if token in {"[CLS]", "[SEP]", "[PAD]"}:
            continue

        # --------------------------------------------------
        # Outside entity
        # --------------------------------------------------

        if label == "O":
            if current_tokens:
                entities.append(
                    build_entity(
                        current_tokens,
                        current_label
                    )
                )

                current_tokens = []
                current_label = None

            continue

        # --------------------------------------------------
        # Beginning of entity
        # --------------------------------------------------

        if label.startswith("B-"):
            if current_tokens:
                entities.append(
                    build_entity(
                        current_tokens,
                        current_label
                    )
                )

            current_tokens = [token]
            current_label = label[2:]

        # --------------------------------------------------
        # Inside entity
        # --------------------------------------------------

        elif label.startswith("I-"):
            entity_type = label[2:]

            if current_label == entity_type:
                current_tokens.append(token)

            else:
                if current_tokens:
                    entities.append(
                        build_entity(
                            current_tokens,
                            current_label
                        )
                    )

                current_tokens = [token]
                current_label = entity_type

    # --------------------------------------------------
    # Final entity
    # --------------------------------------------------

    if current_tokens:
        entities.append(
            build_entity(
                current_tokens,
                current_label
            )
        )

    return entities