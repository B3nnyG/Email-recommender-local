"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { ParsedData, ReviewDraft } from "@/lib/types";

interface ParsedDataContextValue {
  parsedData: ParsedData | null;
  setParsedData: (data: ParsedData | null) => void;
  /** Live Page 2 editing state. Persists across Page 2 <-> Page 3
   * navigation so "Back" from Page 3 (unlike Page 1 <-> 2's "Back") keeps
   * every edit, including per-field EN/ZH translations. */
  reviewDraft: ReviewDraft | null;
  setReviewDraft: React.Dispatch<React.SetStateAction<ReviewDraft | null>>;
  /** No server-side persistence: going Back to Page 1 (FR2.9) or starting a
   * new submission from Page 3 clears everything so the user re-uploads
   * rather than seeing stale data. */
  resetFlow: () => void;
}

const ParsedDataContext = createContext<ParsedDataContextValue | null>(null);

export function ParsedDataProvider({ children }: { children: ReactNode }) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);

  const value = useMemo(
    () => ({
      parsedData,
      setParsedData,
      reviewDraft,
      setReviewDraft,
      resetFlow: () => {
        setParsedData(null);
        setReviewDraft(null);
      },
    }),
    [parsedData, reviewDraft],
  );

  return <ParsedDataContext.Provider value={value}>{children}</ParsedDataContext.Provider>;
}

export function useParsedData() {
  const context = useContext(ParsedDataContext);
  if (!context) {
    throw new Error("useParsedData must be used within a ParsedDataProvider");
  }
  return context;
}
