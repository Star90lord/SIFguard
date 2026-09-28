from pathlib import Path

import torch
from transformers import AutoModelForTokenClassification

from nlp_service.app.core.config import MODEL_PATH


# --------------------------------------------------
# Model Loader
# --------------------------------------------------

def load_ner_model(
    model_path: Path = MODEL_PATH
):
    """
    Load the trained SIFguard NER model.

    The model must already exist at model_path.
    """

    model_path = Path(model_path)

    if not model_path.exists():
        raise FileNotFoundError(
            f"NER model directory not found: {model_path}"
        )

    if not any(model_path.iterdir()):
        raise FileNotFoundError(
            f"NER model directory is empty: {model_path}"
        )

    model = AutoModelForTokenClassification.from_pretrained(
        model_path
    )

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    model.to(device)

    model.eval()

    return model, device