"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { ParsedData } from "@/lib/types";

interface ParsedDataContextValue {
  parsedData: ParsedData | null;
  setParsedData: (data: ParsedData | null) => void;
}

const ParsedDataContext = createContext<ParsedDataContextValue | null>(null);

export function ParsedDataProvider({ children }: { children: ReactNode }) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);

  const value = useMemo(() => ({ parsedData, setParsedData }), [parsedData]);

  return <ParsedDataContext.Provider value={value}>{children}</ParsedDataContext.Provider>;
}

export function useParsedData() {
  const context = useContext(ParsedDataContext);
  if (!context) {
    throw new Error("useParsedData must be used within a ParsedDataProvider");
  }
  return context;
}
