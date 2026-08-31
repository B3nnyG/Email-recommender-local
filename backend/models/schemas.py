from pydantic import BaseModel


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
