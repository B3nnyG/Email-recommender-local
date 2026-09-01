from fastapi import APIRouter, HTTPException

from models.schemas import GenerateEmailRequest, GenerateEmailResponse, TemplateInfo
from services.template_rendering import (
    TemplateNotFoundError,
    build_subject,
    list_templates,
    render_email,
)

router = APIRouter()


@router.get("/templates", response_model=list[TemplateInfo])
async def get_templates() -> list[TemplateInfo]:
    return [TemplateInfo(**entry) for entry in list_templates()]


@router.post("/generate-email", response_model=GenerateEmailResponse)
async def generate_email(request: GenerateEmailRequest) -> GenerateEmailResponse:
    """Deterministic {{token}} substitution against the requested template
    (Feature 3) — no Claude API call anywhere in this endpoint.
    """
    data = request.data.model_dump()
    try:
        rendered = render_email(request.template_id, data)
    except TemplateNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return GenerateEmailResponse(subject=build_subject(data), rendered_email=rendered)
