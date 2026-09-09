import json
from pathlib import Path

from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    DataCollatorForTokenClassification,
    TrainingArguments,
    Trainer,
)


BASE_MODEL = "distilbert-base-uncased"

DATASET_DIR = Path(
    "datasets/processed"
)

OUTPUT_DIR = Path(
    "nlp_service/models/sif_distilbert"
)


def load_json(filename):

    with open(
        DATASET_DIR / filename,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


def main():

    train_data = load_json(
        "train.json"
    )

    validation_data = load_json(
        "validation.json"
    )

    with open(
        DATASET_DIR / "labels.json",
        "r",
        encoding="utf-8"
    ) as file:

        label_data = json.load(file)

    labels = label_data["labels"]

    label2id = {
        label: index
        for index, label in enumerate(labels)
    }

    id2label = {
        index: label
        for index, label in enumerate(labels)
    }

    train_dataset = Dataset.from_list(
        train_data
    )

    validation_dataset = Dataset.from_list(
        validation_data
    )

    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL
    )

    def tokenize_and_align_labels(examples):

        tokenized_inputs = tokenizer(
            examples["tokens"],
            truncation=True,
            max_length=512,
            is_split_into_words=True
        )

        all_labels = []

        for batch_index, labels_for_example in enumerate(
            examples["ner_tags"]
        ):

            word_ids = tokenized_inputs.word_ids(
                batch_index=batch_index
            )

            previous_word_id = None
            label_ids = []

            for word_id in word_ids:

                if word_id is None:
                    label_ids.append(-100)

                elif word_id != previous_word_id:
                    label_ids.append(
                        labels_for_example[word_id]
                    )

                else:
                    current_label = labels[
                        labels_for_example[word_id]
                    ]

                    if current_label.startswith("B-"):
                        inside_label = (
                            "I-" +
                            current_label[2:]
                        )

                        label_ids.append(
                            label2id[inside_label]
                        )

                    else:
                        label_ids.append(
                            labels_for_example[word_id]
                        )

                previous_word_id = word_id

            all_labels.append(label_ids)

        tokenized_inputs["labels"] = all_labels

        return tokenized_inputs

    tokenized_train = train_dataset.map(
        tokenize_and_align_labels,
        batched=True
    )

    tokenized_validation = validation_dataset.map(
        tokenize_and_align_labels,
        batched=True
    )

    model = AutoModelForTokenClassification.from_pretrained(
        BASE_MODEL,
        num_labels=len(labels),
        id2label=id2label,
        label2id=label2id
    )

    data_collator = DataCollatorForTokenClassification(
        tokenizer=tokenizer
    )

    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        learning_rate=2e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=5,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        logging_steps=50,
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_validation,
        processing_class=tokenizer,
        data_collator=data_collator
    )

    trainer.train()

    trainer.save_model(
        OUTPUT_DIR
    )

    tokenizer.save_pretrained(
        OUTPUT_DIR
    )

    print()
    print("Training completed.")
    print(
        f"Model saved to: {OUTPUT_DIR}"
    )


if __name__ == "__main__":
    main()