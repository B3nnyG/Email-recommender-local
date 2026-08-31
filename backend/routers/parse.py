import os

from fastapi import APIRouter, File, UploadFile

from config import settings
from models.schemas import ParseResponse
from services.file_validation import read_and_validate
from services.llm_extraction import extract_resume_fields, extract_screenshot_fields
from services.ocr import extract_screenshot_text
from services.text_extraction import extract_resume_text

router = APIRouter()


@router.post("/parse", response_model=ParseResponse)
async def parse_documents(
    resume: UploadFile = File(...),
    screenshot: UploadFile = File(...),
) -> ParseResponse:
    """Accept a resume (pdf/docx) + notes screenshot (jpg/png), extract text from
    each in memory (no disk writes, per NFR1.2), run structured field extraction
    via Claude (see services/llm_extraction.py), and return the structured data
    schema.
    """
    resume_bytes = await read_and_validate(resume, settings.resume_extensions, "Resume")
    screenshot_bytes = await read_and_validate(
        screenshot, settings.screenshot_extensions, "Screenshot"
    )

    resume_ext = os.path.splitext(resume.filename or "")[1].lower()
    resume_text = extract_resume_text(resume_bytes, resume_ext)
    screenshot_text = extract_screenshot_text(screenshot_bytes)

    resume_fields = extract_resume_fields(resume_text)
    screenshot_fields = extract_screenshot_fields(screenshot_text)

    return ParseResponse(**resume_fields, **screenshot_fields)
