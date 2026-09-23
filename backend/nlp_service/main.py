from fastapi import FastAPI, UploadFile, File, HTTPException
from pathlib import Path
import tempfile
import os

from textextraction.extractor import extract_text
from textcleaning.cleaner import clean_text


app = FastAPI()


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/process-document")
async def process_document(
    document: UploadFile = File(...)
):
    suffix = Path(document.filename).suffix.lower()

    if suffix not in [
        ".pdf",
        ".txt",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported document type"
        )

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as temp:

        content = await document.read()
        temp.write(content)
        temp_path = temp.name

    try:
        extracted_text = extract_text(
            temp_path,
            document.filename
        )

        cleaned_text = clean_text(extracted_text)

        return {
            "filename": document.filename,
            "extractedText": extracted_text,
            "cleanedText": cleaned_text,
            "textLength": len(cleaned_text),
            "extractionStatus": (
                "success"
                if extracted_text
                else "empty"
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)