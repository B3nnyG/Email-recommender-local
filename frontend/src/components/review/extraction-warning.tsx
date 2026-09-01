import { TriangleAlert } from "lucide-react";

/** FR2.11: flags a field that came back blank from /parse (extraction
 * failure), distinct from a field the user simply hasn't filled in yet. */
export function ExtractionWarning() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-500">
      <TriangleAlert className="size-3.5" />
      Could not extract — please fill in manually
    </span>
  );
}
