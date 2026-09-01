"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { ReviewTextField } from "@/components/review/review-text-field";
import { TranslatableField } from "@/components/review/translatable-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParsedData } from "@/context/parsed-data-context";
import {
  createInitialReviewDraft,
  isReviewDraftValid,
  TRANSLATABLE_FIELD_KEYS,
} from "@/lib/review-draft";
import type { ReviewDraft, TranslatableField as TranslatableFieldKey } from "@/lib/types";

interface SimpleFieldConfig {
  key: Exclude<keyof ReviewDraft, TranslatableFieldKey>;
  label: string;
  /** Whether this field is populated by /parse (vs. always manual-only). */
  wasParsed: boolean;
}

const SIMPLE_FIELDS: SimpleFieldConfig[] = [
  { key: "name", label: "Name", wasParsed: true },
  { key: "email", label: "Email", wasParsed: true },
  { key: "contact_number", label: "Contact Number", wasParsed: true },
  { key: "education", label: "Education", wasParsed: true },
  { key: "job_title", label: "Job Title", wasParsed: false },
  { key: "company_name", label: "Company Name", wasParsed: false },
  { key: "current_salary", label: "Current Salary", wasParsed: true },
  { key: "expected_salary", label: "Expected Salary", wasParsed: true },
];

const TRANSLATABLE_FIELDS: { key: TranslatableFieldKey; label: string }[] = [
  { key: "recommendation", label: "Recommendation" },
  { key: "motivations", label: "Motivations" },
  { key: "notice_period", label: "Notice Period" },
];

export default function ReviewPage() {
  const router = useRouter();
  const { parsedData, reviewDraft, setReviewDraft, resetFlow } = useParsedData();

  // Fields that came back blank from /parse (extraction failure, FR2.11) —
  // captured once from the immutable parse result, so it stays distinct
  // from the user's live edits in reviewDraft.
  const extractionFailed = useMemo(() => {
    if (!parsedData) return new Set<string>();
    const failed = new Set<string>();
    for (const { key, wasParsed } of SIMPLE_FIELDS) {
      if (wasParsed && !parsedData[key as keyof typeof parsedData]) failed.add(key);
    }
    for (const key of TRANSLATABLE_FIELD_KEYS) {
      if (!parsedData[key]) failed.add(key);
    }
    return failed;
  }, [parsedData]);

  useEffect(() => {
    if (!parsedData) {
      router.replace("/");
      return;
    }
    // Only seed a fresh draft the first time through — if one already
    // exists (returning via Back from Page 3), keep every edit as-is.
    if (!reviewDraft) {
      setReviewDraft(createInitialReviewDraft(parsedData));
    }
  }, [parsedData, reviewDraft, router, setReviewDraft]);

  if (!parsedData || !reviewDraft) return null;

  const isValid = isReviewDraftValid(reviewDraft);

  const handleBack = () => {
    resetFlow();
    router.push("/");
  };

  const handleNext = () => {
    if (!isValid) return;
    router.push("/generate");
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Review & edit candidate details</CardTitle>
          <CardDescription>
            Confirm the extracted details, fill in anything missing, and add the job title and
            company you&apos;re recommending this candidate to.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {SIMPLE_FIELDS.map(({ key, label, wasParsed }) => (
              <ReviewTextField
                key={key}
                id={key}
                label={label}
                value={reviewDraft[key]}
                onChange={(value) => setReviewDraft((prev) => (prev ? { ...prev, [key]: value } : prev))}
                showExtractionWarning={wasParsed && extractionFailed.has(key)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-6">
            {TRANSLATABLE_FIELDS.map(({ key, label }) => (
              <TranslatableField
                key={key}
                fieldKey={key}
                label={label}
                state={reviewDraft[key]}
                onChange={(next) =>
                  setReviewDraft((prev) => (prev ? { ...prev, [key]: next } : prev))
                }
                showExtractionWarning={extractionFailed.has(key)}
              />
            ))}
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button type="button" onClick={handleNext} disabled={!isValid}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
