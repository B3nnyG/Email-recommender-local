import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  step: 1 | 2 | 3;
}

const STEPS = [
  { step: 1, label: "Upload documents" },
  { step: 2, label: "Review fields" },
  { step: 3, label: "Generate email" },
] as const;

export function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <nav className="flex items-center gap-6 border-b border-gray-200 bg-white px-6">
      {STEPS.map((s) => {
        const active = s.step === step;
        return (
          <div
            key={s.step}
            className={cn(
              "flex items-center gap-2 border-b-2 py-3 text-sm",
              active
                ? "border-[#2563EB] font-medium text-[#2563EB]"
                : "border-transparent text-gray-400",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                active ? "bg-[#2563EB] text-white" : "bg-gray-200 text-gray-500",
              )}
            >
              {s.step}
            </span>
            {s.label}
          </div>
        );
      })}
    </nav>
  );
}
