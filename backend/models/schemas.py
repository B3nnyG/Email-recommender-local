from typing import Literal

from pydantic import BaseModel

TranslatableField = Literal["recommendation", "motivations", "notice_period"]


class ParseResponse(BaseModel):
    """Data schema returned by POST /parse (CLAUDE.md data schema table).

    job_title and nationality are intentionally excluded: job_title is a manual
    Page 2 entry and nationality is never parsed at all (manual-only, Page 3).
    Blank string means the field could not be confidently extracted (FR2.11) and
    should be flagged for manual entry by the frontend, not treated as an error.
    """

    name: str = ""
    email: str = ""
    contact_number: str = ""
    education: str = ""
    recommendation: str = ""
    motivations: str = ""
    notice_period: str = ""
    current_salary: str = ""
    expected_salary: str = ""


class TranslateRequest(BaseModel):
    """Request body for POST /translate (FR2.3/FR2.6): translate one field's
    text into Simplified Chinese. Stateless — the caller supplies the text and
    owns storing/displaying both language versions.
    """

    field: TranslatableField
    text: str


class TranslateResponse(BaseModel):
    field: TranslatableField
    translation: str


class TemplateInfo(BaseModel):
    """One entry in GET /templates — id/label only, no file path exposed."""

    id: str
    label: str


class EmailData(BaseModel):
    """Full field schema (CLAUDE.md data schema table) plus job_title, which
    is manual-only on Page 2. nationality is intentionally excluded: it is
    manual-only on the frontend and never sent to the backend.
    """

    name: str = ""
    email: str = ""
    contact_number: str = ""
    education: str = ""
    job_title: str = ""
    # The RECIPIENT client's company — i.e. the company this recommendation
    # email is being sent to. Unrelated to the candidate or their current/past
    # employer. Mandatory, manually entered (CLAUDE.md Subject Generation).
    company_name: str = ""
    recommendation: str = ""
    motivations: str = ""
    notice_period: str = ""
    current_salary: str = ""
    expected_salary: str = ""


class GenerateEmailRequest(BaseModel):
    template_id: str
    data: EmailData


class GenerateEmailResponse(BaseModel):
    subject: str
    rendered_email: str
