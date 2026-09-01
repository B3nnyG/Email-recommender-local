/** Mirrors backend ParseResponse (backend/models/schemas.py). Blank string
 * means the field could not be confidently extracted and should be flagged
 * for manual entry, not treated as an error. */
export interface ParsedData {
  name: string;
  email: string;
  contact_number: string;
  education: string;
  recommendation: string;
  motivations: string;
  notice_period: string;
  current_salary: string;
  expected_salary: string;
}

/** Mirrors backend TranslatableField (backend/models/schemas.py) — the only
 * fields POST /translate accepts. */
export type TranslatableField = "recommendation" | "motivations" | "notice_period";

/** EN/ZH text kept side by side per translatable field (FR2.3/FR2.6):
 * translating must never overwrite the English original, and `active`
 * records which version the user wants sent forward. */
export interface TranslationState {
  en: string;
  zh: string | null;
  active: "en" | "zh";
}

/** Mirrors backend EmailData (backend/models/schemas.py) — the full payload
 * Page 3 will eventually send to POST /generate-email as `data`. */
export interface ReviewedData {
  name: string;
  email: string;
  contact_number: string;
  education: string;
  job_title: string;
  company_name: string;
  recommendation: string;
  motivations: string;
  notice_period: string;
  current_salary: string;
  expected_salary: string;
}
