"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { ParsedData, ReviewedData } from "@/lib/types";

interface ParsedDataContextValue {
  parsedData: ParsedData | null;
  setParsedData: (data: ParsedData | null) => void;
  reviewedData: ReviewedData | null;
  setReviewedData: (data: ReviewedData | null) => void;
  /** No server-side persistence: going Back to Page 1 (FR2.9) clears
   * everything so the user re-uploads rather than seeing stale data. */
  resetFlow: () => void;
}

const ParsedDataContext = createContext<ParsedDataContextValue | null>(null);

export function ParsedDataProvider({ children }: { children: ReactNode }) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [reviewedData, setReviewedData] = useState<ReviewedData | null>(null);

  const value = useMemo(
    () => ({
      parsedData,
      setParsedData,
      reviewedData,
      setReviewedData,
      resetFlow: () => {
        setParsedData(null);
        setReviewedData(null);
      },
    }),
    [parsedData, reviewedData],
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
