import re


# --------------------------------------------------
# Sentence Splitter
# --------------------------------------------------

def split_sentences(text: str) -> list[str]:
    """
    Split cleaned text into individual sentences.
    """

    if not isinstance(text, str):
        raise TypeError("Text must be a string.")

    text = text.strip()

    if not text:
        return []

    # Normalize whitespace around the text.
    text = re.sub(r"\s+", " ", text)

    # Split after sentence-ending punctuation.
    sentences = re.split(
        r"(?<=[.!?])\s+",
        text
    )

    # Remove empty results and surrounding whitespace.
    sentences = [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]

    return sentences
    