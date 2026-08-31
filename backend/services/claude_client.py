"""Shared Anthropic client construction for every Claude Messages API caller."""

import anthropic

from config import settings


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)
