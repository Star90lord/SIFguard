from pathlib import Path

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification
)


MODEL_PATH = Path(
    "nlp_service/models/sif_distilbert"
)


class SIFNER:

    def __init__(self):

        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_PATH
        )

        self.model = AutoModelForTokenClassification.from_pretrained(
            MODEL_PATH
        )

        self.model.eval()

        self.id_to_label = (
            self.model.config.id2label
        )

    def predict(self, text):

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            return_offsets_mapping=True
        )

        offset_mapping = inputs.pop(
            "offset_mapping"
        )

        with torch.no_grad():

            outputs = self.model(
                **inputs
            )

        predictions = torch.argmax(
            outputs.logits,
            dim=2
        )[0]

        entities = []

        current_entity = None

        for index, prediction in enumerate(
            predictions
        ):

            label = self.id_to_label[
                prediction.item()
            ]

            if label == "O":

                if current_entity:
                    entities.append(
                        current_entity
                    )
                    current_entity = None

                continue

            if "-" not in label:
                continue

            prefix, entity_type = label.split(
                "-",
                1
            )

            start, end = offset_mapping[
                0
            ][index].tolist()

            if start == end:
                continue

            if prefix == "B":

                if current_entity:
                    entities.append(
                        current_entity
                    )

                current_entity = {
                    "label": entity_type,
                    "text": text[start:end],
                    "start": start,
                    "end": end
                }

            elif prefix == "I":

                if (
                    current_entity
                    and current_entity["label"]
                    == entity_type
                ):

                    current_entity["text"] = (
                        text[
                            current_entity["start"]:
                            end
                        ]
                    )

                    current_entity["end"] = end

                else:

                    if current_entity:
                        entities.append(
                            current_entity
                        )

                    current_entity = {
                        "label": entity_type,
                        "text": text[start:end],
                        "start": start,
                        "end": end
                    }

        if current_entity:
            entities.append(
                current_entity
            )

        return entities