"use client";

import { useSearchParams } from "next/navigation";
import { PlanSummaryPageContent } from "@/components/plans/plan-summary-page-content";

export function LocalSummaryContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";

  return <PlanSummaryPageContent planId={planId} />;
}
