# Email Recommendation Generator

A 3-page internal tool for a single recruiter: upload a resume + a screenshot of notes,
parse both into structured candidate data, review/edit, then generate a ready-to-send
HR recommendation email from a pre-set template.

## Tech Stack
- **Frontend**: React (Next.js) with TypeScript, Tailwind CSS + shadcn/ui, react-dropzone
- **Backend**: Python (FastAPI)
- **OCR**: Tesseract (local/free) — via `pytesseract`, installed as a system binary (`apt-get install tesseract-ocr`)
- **LLM**: Anthropic API — `ANTHROPIC_MODEL=claude-sonnet-5`
- **Storage**: None. Files are processed in-memory per request and discarded — never written to disk, no object storage, no database.
- **Auth**: None (single personal user, no login required)
- **Deployment target**: Docker Compose (FastAPI + Tesseract + reverse proxy), frontend may deploy separately to Vercel

## The 3-Page Flow
All 3 pages are built and working end-to-end (frontend + backend).

1. **Page 1 — Upload**: user uploads one resume (PDF/DOCX) and one notes screenshot (JPG/PNG). Max 10MB per file. "Next" is disabled until both files + Job Title are present.
2. **Page 2 — Review**: parsed fields are shown in editable form inputs. **All fields are mandatory** to proceed, including manual entries `job_title` and `company_name`. Translation toggle available for `recommendation`, `motivations`, `notice_period`.
3. **Page 3 — Generate**: user picks a template from a dropdown (Generic or Apodex — see Templates below), clicks "Generate Email," edits the subject + body freely, and clicks "Copy." A separate "Start New Submission" button resets everything back to Page 1.

## Data Schema
This is the fixed contract between parsing (Page 2) and template rendering (Page 3).
Field names must match exactly — they are the `{{token}}` names used in templates.

| Field | Source | Notes |
|---|---|---|
| `name` | Resume (PDF/DOCX) | |
| `email` | Resume | |
| `contact_number` | Resume | Normalize to `(+65) xxxxxxxx`. If 2 numbers found, keep the one starting with `+65`. If no country code present, leave for manual edit — don't guess. |
| `education` | Resume | Highest qualification only — degree/qualification + institution, **no dates** (enrollment/graduation dates must be excluded even if present in the source document). |
| `recommendation` | Resume | 2–3 dot points. Prompt Claude with: "Write 2-3 recommendation dot-points, emphasizing large-scale, distributed systems, and AI technology highlights." Store EN and ZH (Simplified) versions separately — **do not overwrite** on translation, keep both. |
| `job_title` | Manual entry (Page 2) | Free text, keyed in by user. Does **not** select the template — it's just inserted as a value. |
| `company_name` | Manual entry (Page 2) | Free text, keyed in by user — same pattern as `job_title`. Mandatory. **This is the recipient client's company** (who the recommendation email is being sent to) — not anything related to the candidate. Used in subject line generation (see Subject Generation below); not currently referenced by any `{{token}}` in the template bodies, but is part of the core data schema like `job_title`, not a Page-3-only afterthought. |
| `motivations` | Screenshot (notes) | Combine "RFL" (Reason for Leaving) + "LF" (Looking For) into one HR-palatable sentence — never show raw RFL/LF labels to the user. Store EN and ZH versions separately. |
| `notice_period` | Screenshot | Store EN and ZH versions separately. |
| `current_salary` | Screenshot ("CS") | |
| `expected_salary` | Screenshot ("ES") | |
| `nationality` | **Not parsed at all** | Left as a blank field in the generated email for the user to type in manually on Page 3. Never add this to the parsed schema or send it through the LLM. |

## Subject Generation
Both templates (Generic and Apodex) generate a subject line using the same fixed, deterministic format — no LLM call:

```
[Dada Consultants]_{company_name}_{job_title}_{name}
```

- `[Dada Consultants]` is a literal string, always present.
- `company_name`, `job_title`, `name` — all come from the standard data schema above (company_name and job_title are manual Page 2 entries; name is parsed).
- Joined with underscores, no spaces added around them.
- Example: `[Dada Consultants]_Acme Corp_Backend Engineer_Lee Siang Meng`

`POST /generate-email` returns subject and body as **separate fields**:
```json
{ "subject": "...", "rendered_email": "..." }
```
The subject is never embedded as a line inside `rendered_email` itself.

If a field can't be confidently extracted, leave it blank and flag it for manual entry —
never guess or silently submit incorrect data.

## Templates
- Two templates only at launch: **Generic** and **Apodex**.
- Templates live as plain-text files in `backend/templates/`, registered in `backend/template_registry.json` (`id`, `label`, `file`). This registry is what populates the Page 3 dropdown — don't hardcode template options in the frontend.
- Template rendering is **deterministic substitution, not an LLM call**. Use a simple regex-based `{{token}}` replacer (see below) — no Jinja2 dependency needed.
- If a template references a token with no value, substitute a bracketed placeholder like `[field not provided]` — never leave a raw `{{token}}` visible in the output.

```python
import re

def render_template(template_str: str, data: dict) -> str:
    def replace_token(match):
        key = match.group(1).strip()
        return str(data.get(key) or f"[{key.replace('_', ' ')} not provided]")
    return re.sub(r"\{\{(.*?)\}\}", replace_token, template_str)
```

## Translation
- Chinese translation is **Simplified Chinese only**.
- Applies to: `recommendation`, `motivations`, `notice_period`.
- Triggered manually per-field via a toggle/button on Page 2 — never automatic.
- Always keep both EN and ZH versions in state; never overwrite the English original.

## API Endpoints (backend)
- `POST /parse` — accepts resume + screenshot, returns the data schema above (fields may be blank if extraction failed)
- `POST /translate` — accepts a field + text, returns Simplified Chinese translation
- `GET /templates` — returns available templates from the registry (`id`, `label`)
- `POST /generate-email` — accepts `template_id` + full data schema (now including `company_name`), returns `{ subject, rendered_email }`

## Rules / Don'ts
- Don't add object storage, a database, or file persistence anywhere — everything is in-memory per request.
- Don't add authentication/login — this is a single-user personal tool.
- Don't let Job Title drive template selection — they are independent.
- Don't use an LLM call for template rendering (Feature 3) — only for extraction/rewriting (Feature 2).
- Don't parse or infer Nationality — it's manual-only.
- Don't overwrite English fields when translating — always store both.
- On Page 2, distinguish a field that's blank because parsing failed to extract it from a field the user simply hasn't filled in yet — show a "Could not extract, please fill in manually" flag/warning on the former, per FR2.11. Both still count as blank/incomplete for the mandatory-field "Next" check, but the UI messaging should differ.
- **Never regenerate, rewrite, or "improve" the contents of `backend/templates/*.txt`** — these are fixed, human-authored template files. Code should only ever read them, never write to them. If a task seems to require changing template content, ask first rather than overwriting.
