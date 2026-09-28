from pathlib import Path

from docx import Document
from pypdf import PdfReader


# --------------------------------------------------
# Supported Extensions
# --------------------------------------------------

SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt"
}


# --------------------------------------------------
# TXT Parser
# --------------------------------------------------

def parse_txt(file_path: Path) -> str:
    """
    Extract text from a plain text file.
    """

    return file_path.read_text(
        encoding="utf-8",
        errors="ignore"
    )


# --------------------------------------------------
# DOCX Parser
# --------------------------------------------------

def parse_docx(file_path: Path) -> str:
    """
    Extract text from a DOCX document.
    """

    document = Document(file_path)

    paragraphs = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    return "\n".join(paragraphs)


# --------------------------------------------------
# PDF Parser
# --------------------------------------------------

def parse_pdf(file_path: Path) -> str:
    """
    Extract text from a PDF document.
    """

    reader = PdfReader(file_path)

    pages = []

    for page in reader.pages:
        text = page.extract_text()

        if text:
            pages.append(text.strip())

    return "\n".join(pages)


# --------------------------------------------------
# Main Parser
# --------------------------------------------------

def parse_document(file_path: str | Path) -> str:
    """
    Detect the document type and extract its text.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Document not found: {path}"
        )

    extension = path.suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported document type: {extension}"
        )

    if extension == ".txt":
        return parse_txt(path)

    if extension == ".docx":
        return parse_docx(path)

    if extension == ".pdf":
        return parse_pdf(path)

    raise ValueError(
        f"Unsupported document type: {extension}"
    )