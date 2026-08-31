"""Translate an already-extracted field into Simplified Chinese (FR2.3/FR2.6).

Stateless: this module does not decide what gets stored or displayed where —
it just takes text and returns its Simplified Chinese translation, or raises
TranslationError if Claude can't be reached or returns nothing usable.
"""

import logging

import anthropic

from config import settings
from services.claude_client import get_client

logger = logging.getLogger(__name__)

TRANSLATION_SYSTEM_PROMPT = """Translate the given text naturally into Simplified Chinese (not Traditional Chinese). Preserve the original tone, meaning, and structure — for example, if the text is formatted as dot points, keep it as dot points. Return ONLY the translated text, with no commentary, explanation, or added labels."""


class TranslationError(Exception):
    """Raised when the Claude API call fails or returns no usable translation."""


def translate_text(text: str) -> str:
    try:
        client = get_client()
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1024,
            system=TRANSLATION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
        )
        translation = "".join(
            block.text for block in response.content if block.type == "text"
        ).strip()
    except (anthropic.APIError, AttributeError) as exc:
        logger.warning("Claude translation failed: %s", exc)
        raise TranslationError(
            "Translation service is currently unavailable. Please try again."
        ) from exc

    if not translation:
        raise TranslationError("Translation service returned no output. Please try again.")

    return translation
