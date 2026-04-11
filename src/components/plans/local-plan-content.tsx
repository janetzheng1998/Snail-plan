"use client";

import { useSearchParams } from "next/navigation";
import { PlanDetailPageContent } from "@/components/plans/plan-detail-page-content";

export function LocalPlanContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";

  return <PlanDetailPageContent planId={planId} />;
}
