"use client";

import { useSearchParams } from "next/navigation";
import { NewRecordPageContent } from "@/components/plans/new-record-page-content";

export function LocalNewRecordContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";

  return <NewRecordPageContent planId={planId} />;
}
