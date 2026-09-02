import { TriangleAlert } from "lucide-react";

/** FR2.11: flags a field that came back blank from /parse (extraction
 * failure), distinct from a field the user simply hasn't filled in yet. */
export function ExtractionWarning() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <TriangleAlert className="size-3" />
      Could not extract — please fill in manually
    </span>
  );
}
