import type { ParsedData, ReviewDraft, ReviewedData, TranslatableField, TranslationState } from "@/lib/types";

export const SIMPLE_FIELD_KEYS = [
  "name",
  "email",
  "contact_number",
  "education",
  "job_title",
  "company_name",
  "current_salary",
  "expected_salary",
] as const;

export const TRANSLATABLE_FIELD_KEYS: TranslatableField[] = [
  "recommendation",
  "motivations",
  "notice_period",
];

export function activeText(state: TranslationState): string {
  return state.active === "en" ? state.en : (state.zh ?? "");
}

function initialTranslationState(text: string): TranslationState {
  return { en: text, zh: null, active: "en" };
}

/** Builds the first-visit Page 2 draft straight from /parse output. Manual-
 * only fields (job_title, company_name) always start blank — they're never
 * parsed. */
export function createInitialReviewDraft(parsedData: ParsedData | null): ReviewDraft {
  return {
    name: parsedData?.name ?? "",
    email: parsedData?.email ?? "",
    contact_number: parsedData?.contact_number ?? "",
    education: parsedData?.education ?? "",
    job_title: "",
    company_name: "",
    current_salary: parsedData?.current_salary ?? "",
    expected_salary: parsedData?.expected_salary ?? "",
    recommendation: initialTranslationState(parsedData?.recommendation ?? ""),
    motivations: initialTranslationState(parsedData?.motivations ?? ""),
    notice_period: initialTranslationState(parsedData?.notice_period ?? ""),
  };
}

export function isReviewDraftValid(draft: ReviewDraft): boolean {
  return (
    SIMPLE_FIELD_KEYS.every((key) => draft[key].trim() !== "") &&
    TRANSLATABLE_FIELD_KEYS.every((key) => activeText(draft[key]).trim() !== "")
  );
}

/** Flattens the draft (resolving each translatable field to whichever
 * version is active) into the exact shape POST /generate-email expects. */
export function toReviewedData(draft: ReviewDraft): ReviewedData {
  return {
    name: draft.name,
    email: draft.email,
    contact_number: draft.contact_number,
    education: draft.education,
    job_title: draft.job_title,
    company_name: draft.company_name,
    current_salary: draft.current_salary,
    expected_salary: draft.expected_salary,
    recommendation: activeText(draft.recommendation),
    motivations: activeText(draft.motivations),
    notice_period: activeText(draft.notice_period),
  };
}
