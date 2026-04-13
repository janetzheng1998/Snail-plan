"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RecordCalendar, type CalendarRecord } from "@/components/plans/record-calendar";
import { getLocalPlans } from "@/lib/local-plans";
import { getLocalRecords, localRecordToPlanRecord, type LocalRecord } from "@/lib/local-records";
import { type Plan } from "@/lib/mock-data";

function mergeRecords(primary: CalendarRecord[], secondary: CalendarRecord[]): CalendarRecord[] {
  const map = new Map<string, CalendarRecord>();

  for (const record of primary) {
    map.set(`${record.planId}:${record.id}`, record);
  }

  for (const record of secondary) {
    map.set(`${record.planId}:${record.id}`, record);
  }

  return [...map.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.planTitle.localeCompare(b.planTitle, "zh-CN")
  );
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

  const localPlanIdSet = useMemo(() => new Set(localPlans.map((plan) => plan.id)), [localPlans]);

  const recordsFromPlans = useMemo<CalendarRecord[]>(() => {
    const scopedPlans = scopedPlanId
      ? localPlans.filter((plan) => plan.id === scopedPlanId)
      : localPlans;

    return scopedPlans.flatMap((plan) =>
      plan.records.map((record) => ({
        ...record,
        planId: plan.id,
        planTitle: plan.title,
        planStatus: plan.status
      }))
    );
  }, [localPlans, scopedPlanId]);

  const recordsFromLocalStorage = useMemo<CalendarRecord[]>(() => {
    const existingPlanRecords = localRecords.filter((record) => localPlanIdSet.has(record.planId));
    const scopedLocalRecords = scopedPlanId
      ? existingPlanRecords.filter((record) => record.planId === scopedPlanId)
      : existingPlanRecords;

    return scopedLocalRecords.map((record) => {
      const resolvedPlan = localPlans.find((plan) => plan.id === record.planId);

      return {
        ...localRecordToPlanRecord(record),
        planId: record.planId,
        planTitle: resolvedPlan?.title ?? "未命名计划",
        planStatus: resolvedPlan?.status ?? "active",
        summary: record.organized.summary
      };
    });
  }, [localPlanIdSet, localRecords, localPlans, scopedPlanId]);

  const records = useMemo(
    () => mergeRecords(recordsFromPlans, recordsFromLocalStorage),
    [recordsFromLocalStorage, recordsFromPlans]
  );

  return <RecordCalendar records={records} />;
}
