import { Suspense } from "react";
import { LocalPlanContent } from "@/components/plans/local-plan-content";

export default function LocalPlanPage() {
  return (
    <Suspense fallback={null}>
      <LocalPlanContent />
    </Suspense>
  );
}
