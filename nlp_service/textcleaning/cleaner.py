import re
import unicodedata


def clean_text(text):
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)

    text = text.replace("\x00", " ")

    text = re.sub(r"[\r\n\t]+", " ", text)

    text = re.sub(r"\s+", " ", text)

    text = re.sub(r"Page\s+\d+(\s+of\s+\d+)?", " ", text, flags=re.IGNORECASE)

    text = re.sub(r"[^a-zA-Z0-9\s.,;:!?()/%&'\-]", " ", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()