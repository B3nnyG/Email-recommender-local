from fastapi import APIRouter, HTTPException

from models.schemas import TranslateRequest, TranslateResponse
from services.translation import TranslationError, translate_text

router = APIRouter()


@router.post("/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest) -> TranslateResponse:
    """Translate one field's text into Simplified Chinese (FR2.3/FR2.6).

    Stateless: this endpoint does not overwrite anything server-side — the
    frontend stores both the English original and this translation and
    decides which populates Page 3. `field` is restricted to
    recommendation/motivations/notice_period; anything else is rejected by
    request validation before this handler runs.
    """
    if not request.text.strip():
        return TranslateResponse(field=request.field, translation="")

    try:
        translation = translate_text(request.text)
    except TranslationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return TranslateResponse(field=request.field, translation=translation)
