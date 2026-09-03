import io
import platform

import pytesseract

if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
from fastapi import HTTPException
from PIL import Image


def extract_screenshot_text(content: bytes) -> str:
    """Run local Tesseract OCR over the notes/chat screenshot (FR2.4)."""
    try:
        image = Image.open(io.BytesIO(content))
        return pytesseract.image_to_string(image).strip()
    except pytesseract.TesseractNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="Tesseract OCR binary not found on this host. Install tesseract-ocr "
            "(see Dockerfile) or set pytesseract.pytesseract.tesseract_cmd.",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to OCR screenshot: {exc}") from exc
