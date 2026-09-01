"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";

import { ExtractionWarning } from "@/components/review/extraction-warning";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, translateField } from "@/lib/api";
import type { TranslatableField as TranslatableFieldKey, TranslationState } from "@/lib/types";

interface TranslatableFieldProps {
  fieldKey: TranslatableFieldKey;
  label: string;
  state: TranslationState;
  onChange: (next: TranslationState) => void;
  showExtractionWarning: boolean;
}

export function TranslatableField({
  fieldKey,
  label,
  state,
  onChange,
  showExtractionWarning,
}: TranslatableFieldProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!state.en.trim() || isTranslating) return;

    setIsTranslating(true);
    setTranslateError(null);

    try {
      const translation = await translateField(fieldKey, state.en);
      onChange({ ...state, zh: translation, active: "zh" });
    } catch (error) {
      setTranslateError(
        error instanceof ApiError ? error.message : "Translation failed. Please try again.",
      );
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${fieldKey}-en`}>
          {label} <span className="text-destructive">*</span>
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={!state.en.trim() || isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Languages className="size-3.5" />
          )}
          Translate to Chinese
        </Button>
      </div>

      <Tabs
        value={state.active}
        onValueChange={(value) => onChange({ ...state, active: value as "en" | "zh" })}
      >
        <TabsList>
          <TabsTrigger value="en">EN</TabsTrigger>
          <TabsTrigger value="zh" disabled={state.zh === null}>
            中文
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en">
          <Textarea
            id={`${fieldKey}-en`}
            value={state.en}
            onChange={(e) => onChange({ ...state, en: e.target.value })}
            rows={4}
          />
        </TabsContent>
        <TabsContent value="zh">
          <Textarea
            id={`${fieldKey}-zh`}
            value={state.zh ?? ""}
            onChange={(e) => onChange({ ...state, zh: e.target.value })}
            rows={4}
          />
        </TabsContent>
      </Tabs>

      {showExtractionWarning && <ExtractionWarning />}
      {translateError && (
        <Alert variant="destructive">
          <AlertDescription>{translateError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
