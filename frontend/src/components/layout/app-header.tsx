interface AppHeaderProps {
  step: 1 | 2 | 3;
}

export function AppHeader({ step }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between bg-[#0B1E3D] px-6 py-3">
      <div className="flex items-center gap-2.5">
        <span className="size-2 rounded-full bg-[#60A5FA]" />
        <span className="text-sm font-medium text-white">Candidate Submission</span>
      </div>
      <span className="text-xs text-[#94A3B8]">Page {step} of 3</span>
    </header>
  );
}
