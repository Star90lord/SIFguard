from pathlib import Path
import fitz
import easyocr


reader = easyocr.Reader(["en"])


def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""

    for page in doc:
        text += page.get_text() + "\n"

    doc.close()

    if len(text.strip()) >= 50:
        return text.strip()

    return extract_pdf_with_ocr(file_path)


def extract_pdf_with_ocr(file_path):
    doc = fitz.open(file_path)
    text = ""

    for page in doc:
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        image_path = f"{file_path}_page_{page.number}.png"

        pix.save(image_path)

        result = reader.readtext(image_path)

        for detection in result:
            text += detection[1] + " "

        Path(image_path).unlink(missing_ok=True)

        text += "\n"

    doc.close()

    return text.strip()


def extract_text_from_image(file_path):
    result = reader.readtext(file_path)

    text = []

    for detection in result:
        text.append(detection[1])

    return "\n".join(text).strip()


def extract_text_from_txt(file_path):
    with open(
        file_path,
        "r",
        encoding="utf-8",
        errors="ignore"
    ) as file:
        return file.read().strip()


def extract_text(file_path, filename):
    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)

    if extension in [".jpg", ".jpeg", ".png", ".webp"]:
        return extract_text_from_image(file_path)

    if extension == ".txt":
        return extract_text_from_txt(file_path)

    raise ValueError("Unsupported file type")