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
