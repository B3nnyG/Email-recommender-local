"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { ReviewTextField } from "@/components/review/review-text-field";
import { TranslatableField } from "@/components/review/translatable-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParsedData } from "@/context/parsed-data-context";
import type { ReviewedData, TranslatableField as TranslatableFieldKey, TranslationState } from "@/lib/types";

interface SimpleFieldConfig {
  key: "name" | "email" | "contact_number" | "education" | "job_title" | "company_name" | "current_salary" | "expected_salary";
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

function activeText(state: TranslationState): string {
  return state.active === "en" ? state.en : (state.zh ?? "");
}

export default function ReviewPage() {
  const router = useRouter();
  const { parsedData, setReviewedData, resetFlow } = useParsedData();

  const [simpleValues, setSimpleValues] = useState<Record<SimpleFieldConfig["key"], string>>(() => ({
    name: parsedData?.name ?? "",
    email: parsedData?.email ?? "",
    contact_number: parsedData?.contact_number ?? "",
    education: parsedData?.education ?? "",
    job_title: "",
    company_name: "",
    current_salary: parsedData?.current_salary ?? "",
    expected_salary: parsedData?.expected_salary ?? "",
  }));

  const [translations, setTranslations] = useState<Record<TranslatableFieldKey, TranslationState>>(() => ({
    recommendation: { en: parsedData?.recommendation ?? "", zh: null, active: "en" },
    motivations: { en: parsedData?.motivations ?? "", zh: null, active: "en" },
    notice_period: { en: parsedData?.notice_period ?? "", zh: null, active: "en" },
  }));

  const [saved, setSaved] = useState(false);

  // Fields that came back blank from /parse (extraction failure, FR2.11) —
  // captured once so it stays distinct from the user's live edits.
  const extractionFailed = useMemo(() => {
    if (!parsedData) return new Set<string>();
    const failed = new Set<string>();
    for (const { key, wasParsed } of SIMPLE_FIELDS) {
      if (wasParsed && !parsedData[key as keyof typeof parsedData]) failed.add(key);
    }
    for (const { key } of TRANSLATABLE_FIELDS) {
      if (!parsedData[key]) failed.add(key);
    }
    return failed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!parsedData) {
      router.replace("/");
    }
  }, [parsedData, router]);

  if (!parsedData) return null;

  const isValid =
    SIMPLE_FIELDS.every(({ key }) => simpleValues[key].trim() !== "") &&
    TRANSLATABLE_FIELDS.every(({ key }) => activeText(translations[key]).trim() !== "");

  const handleBack = () => {
    resetFlow();
    router.push("/");
  };

  const handleNext = () => {
    if (!isValid) return;

    const reviewed: ReviewedData = {
      name: simpleValues.name,
      email: simpleValues.email,
      contact_number: simpleValues.contact_number,
      education: simpleValues.education,
      job_title: simpleValues.job_title,
      company_name: simpleValues.company_name,
      current_salary: simpleValues.current_salary,
      expected_salary: simpleValues.expected_salary,
      recommendation: activeText(translations.recommendation),
      motivations: activeText(translations.motivations),
      notice_period: activeText(translations.notice_period),
    };

    setReviewedData(reviewed);
    console.log("Reviewed data ready for Page 3:", reviewed);
    setSaved(true);
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
                value={simpleValues[key]}
                onChange={(value) => {
                  setSimpleValues((prev) => ({ ...prev, [key]: value }));
                  setSaved(false);
                }}
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
                state={translations[key]}
                onChange={(next) => {
                  setTranslations((prev) => ({ ...prev, [key]: next }));
                  setSaved(false);
                }}
                showExtractionWarning={extractionFailed.has(key)}
              />
            ))}
          </div>

          {saved && (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                Saved — this candidate&apos;s details are ready for the next step.
              </AlertDescription>
            </Alert>
          )}

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
