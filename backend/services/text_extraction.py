import io

import mammoth
import pdfplumber
from fastapi import HTTPException


def extract_pdf_text(content: bytes) -> str:
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages).strip()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {exc}") from exc


def extract_docx_text(content: bytes) -> str:
    try:
        result = mammoth.extract_raw_text(io.BytesIO(content))
        return result.value.strip()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse DOCX: {exc}") from exc


def extract_resume_text(content: bytes, extension: str) -> str:
    if extension == ".pdf":
        return extract_pdf_text(content)
    if extension == ".docx":
        return extract_docx_text(content)
    raise HTTPException(status_code=400, detail=f"Unsupported resume extension: {extension}")
