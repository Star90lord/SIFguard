import re


def clean_text(text):
    """
    Clean raw text extracted from a PDF.

    This function focuses on text/PDF cleanup only.
    NLP-based keyword/context extraction is handled separately.
    """

    if not text:
        return ""

    # --------------------------------------------------
    # 1. Normalize common PDF extraction artifacts
    # --------------------------------------------------
    text = text.replace("\uFFFD", " ")   # � replacement character
    text = text.replace("\uf0b7", " ")   # PDF bullet artifact
    text = text.replace("\u00a0", " ")  # non-breaking space

    # --------------------------------------------------
    # 2. Remove email addresses
    # --------------------------------------------------
    text = re.sub(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        " ",
        text
    )

    # --------------------------------------------------
    # 3. Remove URLs
    # --------------------------------------------------
    text = re.sub(
        r"https?://\S+|www\.\S+",
        " ",
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------------------
    # 4. Remove common PDF/IEEE header artifacts
    # --------------------------------------------------
    text = re.sub(
        r"\b\d{3,4}-\d{4}-\d{4}-\d{4}/\d{2}/\$[\d.]+\s*©?\s*\d{4}\s*IEEE\b",
        " ",
        text,
        flags=re.IGNORECASE
    )

    # Remove "Authorized licensed use..." type PDF notices
    text = re.sub(
        r"Authorized licensed use limited to:.*?(?=\n|$)",
        " ",
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------------------
    # 5. Normalize unusual dash characters
    # --------------------------------------------------
    text = text.replace("—", "-")
    text = text.replace("–", "-")
    text = text.replace("-", "-")

    # --------------------------------------------------
    # 6. Normalize whitespace
    # --------------------------------------------------
    text = re.sub(r"[ \t]+", " ", text)

    # --------------------------------------------------
    # 7. Clean individual lines
    # --------------------------------------------------
    lines = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            lines.append("")
            continue

        # Remove standalone page numbers
        if re.fullmatch(r"\d+", line):
            continue

        # Remove standalone citation numbers such as [1], [12]
        if re.fullmatch(r"\[\d+(?:,\s*\d+)*\]", line):
            continue

        lines.append(line)

    text = "\n".join(lines)

    # --------------------------------------------------
    # 8. Remove excessive blank lines
    # --------------------------------------------------
    text = re.sub(r"\n{3,}", "\n\n", text)

    # --------------------------------------------------
    # 9. Remove repeated spaces around punctuation
    # --------------------------------------------------
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)

    # --------------------------------------------------
    # 10. Final cleanup
    # --------------------------------------------------
    return text.strip()