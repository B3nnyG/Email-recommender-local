"""Structured field extraction from raw text via the Claude Messages API.

Resume fields (FR2.1):
  - name, email, contact_number (normalize to "(+65) xxxxxxxx"; if two numbers are
    present keep only the one starting with +65; if neither has a country code,
    leave contact_number blank for manual entry), education (highest level only),
    recommendation (2-3 dot points). Prompt Claude with: "Write 2-3 recommendation
    dot-points, emphasizing large-scale, distributed systems, and AI technology
    highlights."

Screenshot fields (FR2.4/FR2.5):
  - RFL (Reason for Leaving) + LF (Looking For) combined into one HR-appropriate
    "motivations" paragraph (never surface raw RFL/LF labels), notice_period,
    current_salary (CS), expected_salary (ES).

Every field falls back to "" if it can't be confidently extracted (FR2.11:
"if a field cannot be confidently extracted, leave it blank and flag it for
manual entry rather than guessing"), including when the API call itself fails.
"""

import json
import logging
import re

import anthropic

from config import settings
from services.claude_client import get_client

logger = logging.getLogger(__name__)

RESUME_SYSTEM_PROMPT = """You are extracting structured fields from a candidate's resume text for an HR system.

Given the resume text, return ONLY a single JSON object with exactly these keys — no markdown, no code fences, no explanation:

- "name": the candidate's full name.
- "email": the candidate's email address.
- "contact_number": the candidate's phone number, normalized to the format "(+65) xxxxxxxx". If two phone numbers are present, keep only the one that has a +65 country code and discard the other. If neither number includes a country code, set this field to an empty string so it can be entered manually.
- "education": the candidate's highest level of education only (e.g. degree and institution) — not the full education history. Return just "[Degree/Qualification], [Institution]" — no dates.
- "recommendation": Write 2-3 recommendation dot points, emphasizing large-scale, distributed systems, and AI technology highlights. Return this as a single string with each point on its own line, each line starting with "- ".

If a field cannot be confidently extracted from the text, set it to an empty string rather than guessing."""

SCREENSHOT_SYSTEM_PROMPT = """You are extracting structured fields from an HR recruiter's notes (OCR text from a screenshot) for an HR system.

The notes are noisy OCR output containing many unrelated bullet points (team info, tech stack, performance reviews, salary details, other job applications, etc). Given the text, return ONLY a single JSON object with exactly these keys — no markdown, no code fences, no explanation:

- "motivations": The candidate's Reason for Leaving (RFL) and Looking For (LF), combined into a single HR-appropriate sentence/paragraph. To find this content:
  1. Search the ENTIRE text for lines containing "RFL" and "LF" anywhere — they may appear inline after a label on one line, as separate bullet points below a "Motivations:" header, indented, or scattered among many unrelated bullets. Ignore everything that isn't RFL/LF content.
  2. The content after "RFL:" or "LF:" may be in English, Chinese, or a mix of both (e.g. "RFL: 系统比较成熟而且组架构一直调整...") — extract the full content regardless of language, and write the final "motivations" output in English.
  3. Combine whatever RFL and LF content you find into one natural, professional sentence. Never surface the raw labels "RFL" or "LF" in the output.
  4. If no lines labeled "RFL" or "LF" exist anywhere, but a "Motivations:" label with inline text is present, use that text directly instead.
  5. Only return an empty string if none of the above (RFL, LF, or a Motivations label) can be found anywhere in the text — do not guess or fabricate.
- "notice_period": the candidate's notice period.
- "current_salary": the candidate's current salary (may be labeled CS).
- "expected_salary": the candidate's expected salary (may be labeled ES).

If a field cannot be confidently extracted from the text, set it to an empty string rather than guessing."""


def _extract_json_object(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in response text")
    return json.loads(match.group(0))


def _call_claude(system_prompt: str, user_text: str, fields: list[str]) -> dict:
    blank = {field: "" for field in fields}
    if not user_text.strip():
        return blank

    try:
        client = get_client()
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_text}],
        )
        raw_text = "".join(block.text for block in response.content if block.type == "text")
        parsed = _extract_json_object(raw_text)
    except (anthropic.APIError, json.JSONDecodeError, ValueError, AttributeError) as exc:
        logger.warning("Claude extraction failed, returning blank fields: %s", exc)
        return blank

    return {field: str(parsed.get(field) or "") for field in fields}


def extract_resume_fields(resume_text: str) -> dict:
    return _call_claude(
        RESUME_SYSTEM_PROMPT,
        resume_text,
        ["name", "email", "contact_number", "education", "recommendation"],
    )


def extract_screenshot_fields(screenshot_text: str) -> dict:
    return _call_claude(
        SCREENSHOT_SYSTEM_PROMPT,
        screenshot_text,
        ["motivations", "notice_period", "current_salary", "expected_salary"],
    )
