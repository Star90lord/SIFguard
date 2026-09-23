import json
from pathlib import Path

import numpy as np
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    Trainer,
)


MODEL_DIR = Path(
    "nlp_service/models/sif_distilbert"
)

DATASET_DIR = Path(
    "datasets/processed"
)


def main():

    with open(
        DATASET_DIR / "test.json",
        "r",
        encoding="utf-8"
    ) as file:

        test_data = json.load(file)

    with open(
        DATASET_DIR / "labels.json",
        "r",
        encoding="utf-8"
    ) as file:

        label_data = json.load(file)

    labels = label_data["labels"]

    dataset = Dataset.from_list(
        test_data
    )

    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_DIR
    )

    model = AutoModelForTokenClassification.from_pretrained(
        MODEL_DIR
    )

    def tokenize(examples):

        tokenized = tokenizer(
            examples["tokens"],
            truncation=True,
            max_length=512,
            is_split_into_words=True
        )

        all_labels = []

        for batch_index, example_labels in enumerate(
            examples["ner_tags"]
        ):

            word_ids = tokenized.word_ids(
                batch_index=batch_index
            )

            previous_word_id = None
            labels_for_tokens = []

            for word_id in word_ids:

                if word_id is None:
                    labels_for_tokens.append(-100)

                elif word_id != previous_word_id:
                    labels_for_tokens.append(
                        example_labels[word_id]
                    )

                else:
                    labels_for_tokens.append(
                        -100
                    )

                previous_word_id = word_id

            all_labels.append(
                labels_for_tokens
            )

        tokenized["labels"] = all_labels

        return tokenized

    tokenized_dataset = dataset.map(
        tokenize,
        batched=True
    )

    trainer = Trainer(
        model=model,
        processing_class=tokenizer
    )

    predictions = trainer.predict(
        tokenized_dataset
    )

    predicted_ids = np.argmax(
        predictions.predictions,
        axis=2
    )

    total_correct = 0
    total_predictions = 0

    for prediction, labels_for_example in zip(
        predicted_ids,
        predictions.label_ids
    ):

        for predicted, actual in zip(
            prediction,
            labels_for_example
        ):

            if actual == -100:
                continue

            total_predictions += 1

            if predicted == actual:
                total_correct += 1

    accuracy = (
        total_correct / total_predictions
        if total_predictions
        else 0
    )

    print()
    print("Evaluation completed.")
    print(
        f"Token accuracy: "
        f"{accuracy:.4f}"
    )


if __name__ == "__main__":
    main()