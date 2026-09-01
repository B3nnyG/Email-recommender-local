import type { ParsedData, TranslatableField } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {}

export async function parseDocuments(resume: File, screenshot: File): Promise<ParsedData> {
  const formData = new FormData();
  formData.append("resume", resume);
  formData.append("screenshot", screenshot);

  const response = await fetch(`${API_BASE_URL}/parse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(detail || `Parse request failed with status ${response.status}`);
  }

  return response.json();
}

export async function translateField(field: TranslatableField, text: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field, text }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(detail || `Translate request failed with status ${response.status}`);
  }

  const data: { translation: string } = await response.json();
  return data.translation;
}
