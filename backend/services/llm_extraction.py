"""Structured field extraction from raw text.

TODO: Wire up the real Anthropic Messages API calls here (ANTHROPIC_MODEL=claude-sonnet-5).

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

Until the LLM call is wired up, every field below is returned blank per FR2.11
("if a field cannot be confidently extracted, leave it blank and flag it for
manual entry rather than guessing").
"""


def extract_resume_fields(resume_text: str) -> dict:
    # TODO: call Claude (Messages API) with `resume_text` and parse its structured
    # response into these fields instead of returning blanks.
    return {
        "name": "",
        "email": "",
        "contact_number": "",
        "education": "",
        "recommendation": "",
    }


def extract_screenshot_fields(screenshot_text: str) -> dict:
    # TODO: call Claude (Messages API) with `screenshot_text` to pull RFL/LF/notice
    # period/CS/ES and rewrite RFL+LF into a single HR-appropriate "motivations"
    # paragraph (FR2.5), instead of returning blanks.
    return {
        "motivations": "",
        "notice_period": "",
        "current_salary": "",
        "expected_salary": "",
    }
