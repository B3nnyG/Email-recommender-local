import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { StepIndicator } from "@/components/layout/step-indicator";

interface AppShellProps {
  step: 1 | 2 | 3;
  children: ReactNode;
}

export function AppShell({ step, children }: AppShellProps) {
  return (
    <div className="flex flex-1 flex-col bg-[#EEF2F8]">
      <AppHeader step={step} />
      <StepIndicator step={step} />
      <div className="flex flex-1 items-center justify-center px-6 py-10">{children}</div>
    </div>
  );
}
