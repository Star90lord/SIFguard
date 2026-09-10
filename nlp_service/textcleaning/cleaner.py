"""Safety-report text cleaning for SIFguard.

Deliberately conservative: whitespace / formatting / OCR artefacts are
normalized, but safety-critical content is preserved — equipment names,
energy terms, quantities, units (480V, 12 bar, 75°C), negations
("not isolated"), and sentence boundaries.
"""

import re
import unicodedata


# Repeated header/footer patterns commonly stamped on exported reports.
_HEADER_FOOTER_PATTERNS = [
    r"Page\s+\d+(\s+of\s+\d+)?",
    r"Confidential\s*[-–—]?\s*Internal\s+Use\s+Only",
]

# Keep: letters, digits, whitespace and safety-relevant punctuation incl.
# units/symbols (%, °, ±, µ, Ω, ², ³, ×) and sentence boundaries.
_ALLOWED_EXTRA = ".,;:!?()/%&'\\-+°±µΩ²³×\""


def clean_text(text):
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\x00", " ")

    # Normalize line breaks/tabs to spaces (sentence boundaries kept as
    # periods; downstream NER works on sentence text, not layout).
    text = re.sub(r"[\r\n\t]+", " ", text)

    for pattern in _HEADER_FOOTER_PATTERNS:
        text = re.sub(pattern, " ", text, flags=re.IGNORECASE)

    text = re.sub(f"[^a-zA-Z0-9\\s{re.escape(_ALLOWED_EXTRA)}]", " ", text)

    text = re.sub(r"\s+", " ", text)
    return text.strip()
