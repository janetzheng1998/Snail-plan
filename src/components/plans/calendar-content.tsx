"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RecordCalendar } from "@/components/plans/record-calendar";
import { getLocalPlans, mergePlansWithLocal } from "@/lib/local-plans";
import { getLocalRecords, localRecordToPlanRecord, type LocalRecord } from "@/lib/local-records";
import { plans, type Plan, type PlanRecord } from "@/lib/mock-data";

function mergeRecords(primary: PlanRecord[], secondary: PlanRecord[]): PlanRecord[] {
  const map = new Map<string, PlanRecord>();

  for (const record of primary) {
    map.set(record.id, record);
  }

  for (const record of secondary) {
    map.set(record.id, record);
  }

  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export function CalendarContent() {
  const searchParams = useSearchParams();
  const scopedPlanId = searchParams.get("planId") ?? "";
  const [localPlans, setLocalPlans] = useState<Plan[]>([]);
  const [localRecords, setLocalRecords] = useState<LocalRecord[]>([]);

  useEffect(() => {
    const syncFromStorage = () => {
      setLocalPlans(getLocalPlans());
      setLocalRecords(getLocalRecords());
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const mergedPlans = useMemo(() => mergePlansWithLocal(plans, localPlans), [localPlans]);

  const recordsFromPlans = useMemo(() => {
    if (!scopedPlanId) {
      return mergedPlans.flatMap((plan) => plan.records);
    }

    return mergedPlans.find((plan) => plan.id === scopedPlanId)?.records ?? [];
  }, [mergedPlans, scopedPlanId]);

  const recordsFromLocalStorage = useMemo(() => {
    const scoped = scopedPlanId
      ? localRecords.filter((record) => record.planId === scopedPlanId)
      : localRecords;
    return scoped.map(localRecordToPlanRecord);
  }, [localRecords, scopedPlanId]);

  const records = useMemo(
    () => mergeRecords(recordsFromPlans, recordsFromLocalStorage),
    [recordsFromLocalStorage, recordsFromPlans]
  );

  return <RecordCalendar records={records} />;
}
