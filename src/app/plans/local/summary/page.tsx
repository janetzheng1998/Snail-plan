import { Suspense } from "react";
import { LocalSummaryContent } from "@/components/plans/local-summary-content";

export default function LocalPlanSummaryPage() {
  return (
    <Suspense fallback={null}>
      <LocalSummaryContent />
    </Suspense>
  );
}
