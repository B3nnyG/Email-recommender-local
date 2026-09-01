import { ExtractionWarning } from "@/components/review/extraction-warning";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReviewTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showExtractionWarning: boolean;
}

export function ReviewTextField({
  id,
  label,
  value,
  onChange,
  showExtractionWarning,
}: ReviewTextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      {showExtractionWarning && <ExtractionWarning />}
    </div>
  );
}
