import re


# --------------------------------------------------
# Normalize Line Breaks
# --------------------------------------------------

def normalize_line_breaks(text: str) -> str:
    """
    Normalize different types of line breaks.
    """

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    return text


# --------------------------------------------------
# Normalize Whitespace
# --------------------------------------------------

def normalize_whitespace(text: str) -> str:
    """
    Remove unnecessary spaces and tabs while
    preserving meaningful line breaks.
    """

    text = text.replace("\t", " ")

    text = re.sub(
        r"[ ]{2,}",
        " ",
        text
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    return text


# --------------------------------------------------
# Clean Lines
# --------------------------------------------------

def clean_lines(text: str) -> str:
    """
    Remove unnecessary spaces at the beginning
    and end of each line.
    """

    lines = []

    for line in text.split("\n"):
        cleaned_line = line.strip()

        if cleaned_line:
            lines.append(cleaned_line)

    return "\n".join(lines)


# --------------------------------------------------
# Main Cleaner
# --------------------------------------------------

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        raise TypeError("Text must be a string.")

    if not text.strip():
        return ""

    text = normalize_line_breaks(text)
    text = normalize_whitespace(text)
    text = clean_lines(text)
    text = clean_checkbox_options(text)
    text = remove_generated_metadata(text)
    text = remove_generated_analysis_section(text)

    return text.strip()

# --------------------------------------------------
# Clean Checkbox Options
# --------------------------------------------------

def clean_checkbox_options(text: str) -> str:
    """
    Remove unchecked checkbox options while preserving
    explicitly selected options.
    """

    lines = []

    for line in text.split("\n"):

        stripped_line = line.strip()

        if not stripped_line:
            continue

        unchecked_match = re.match(
            r"^\[\s*\]\s*(.*)$",
            stripped_line
        )

        if unchecked_match:
            continue

        checked_match = re.match(
            r"^\[\s*[xX]\s*\]\s*(.*)$",
            stripped_line
        )

        if checked_match:
            selected_text = checked_match.group(1).strip()

            if selected_text:
                lines.append(selected_text)

            continue

        lines.append(stripped_line)

    return "\n".join(lines)

def remove_generated_metadata(text: str) -> str:
    """
    Remove automatically generated system/form metadata
    that should not be treated as incident evidence.
    """

    lines = text.split("\n")

    filtered_lines = []

    metadata_phrases = [
        "populated automatically by the document intelligence pipeline.",
        "high-confidence entities shown below.",
    ]

    for line in lines:

        cleaned_line = line.strip()

        if not cleaned_line:
            continue

        normalized = " ".join(
            cleaned_line.lower().split()
        )

        for phrase in metadata_phrases:
            normalized = normalized.replace(
                phrase,
                ""
            )

        normalized = normalized.strip()

        if normalized:
            filtered_lines.append(
                normalized
            )

    return "\n".join(filtered_lines)

def remove_generated_analysis_section(text: str) -> str:
    """
    Remove the automatically generated NLP analysis section
    from the source report before NER processing.

    Removes:
        Section 4. Extracted Entities (Automated NLP Analysis)

    Preserves:
        Section 5 and all following report content.
    """

    lines = text.split("\n")

    filtered_lines = []

    skip_section = False

    for line in lines:

        normalized = " ".join(
            line.lower().strip().split()
        )

        if (
            normalized.startswith(
                "4. extracted entities (automated nlp analysis)"
            )
        ):
            skip_section = True
            continue

        if skip_section and normalized.startswith(
            "5. high-energy hazard classification"
        ):
            skip_section = False
            filtered_lines.append(line)
            continue

        if not skip_section:
            filtered_lines.append(line)

    return "\n".join(filtered_lines)