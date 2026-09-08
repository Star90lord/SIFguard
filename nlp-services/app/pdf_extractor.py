import sys
import json
import pymupdf

from text_cleaner import clean_text
from chunker import chunk_text

sys.stdout.reconfigure(encoding="utf-8")

pdf_path = sys.argv[1]

pdf = pymupdf.open(pdf_path)

text = ""

for page in pdf:
    text += page.get_text()

pdf.close()

cleaned_text = clean_text(text)

chunks = chunk_text(cleaned_text)

print(json.dumps(chunks, ensure_ascii=False))