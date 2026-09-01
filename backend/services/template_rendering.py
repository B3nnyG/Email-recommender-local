"""Template listing and deterministic {{token}} substitution for Feature 3.

No Claude API call anywhere in this module — rendering is pure string
substitution against template_registry.json and the .txt files it points to.
"""

import json
import re
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
REGISTRY_PATH = BACKEND_DIR / "template_registry.json"
TEMPLATES_DIR = BACKEND_DIR / "templates"


class TemplateNotFoundError(Exception):
    """Raised when template_id has no matching entry in the registry."""


def _load_registry() -> list[dict]:
    with open(REGISTRY_PATH, encoding="utf-8") as f:
        return json.load(f)


def list_templates() -> list[dict]:
    return [{"id": entry["id"], "label": entry["label"]} for entry in _load_registry()]


def _field_or_placeholder(data: dict, key: str) -> str:
    return str(data.get(key) or f"[{key.replace('_', ' ')} not provided]")


def render_template(template_str: str, data: dict) -> str:
    def replace_token(match):
        key = match.group(1).strip()
        return _field_or_placeholder(data, key)

    return re.sub(r"\{\{(.*?)\}\}", replace_token, template_str)


def build_subject(data: dict) -> str:
    """[Dada Consultants]_{company_name}_{job_title}_{name} (CLAUDE.md Subject
    Generation) — deterministic, same format regardless of template_id.
    company_name is the recipient client's company, subject-line use only; it
    is not a {{token}} in either template body.
    """
    parts = [_field_or_placeholder(data, key) for key in ("company_name", "job_title", "name")]
    return "_".join(["[Dada Consultants]", *parts])


def render_email(template_id: str, data: dict) -> str:
    entry = next((e for e in _load_registry() if e["id"] == template_id), None)
    if entry is None:
        raise TemplateNotFoundError(f"No template found for template_id '{template_id}'")

    template_str = (TEMPLATES_DIR / entry["file"]).read_text(encoding="utf-8")
    return render_template(template_str, data)
