import type { Plan, PlanRecord } from "@/lib/mock-data";

const LOCAL_PLANS_STORAGE_KEY = "snail-plan-local-plans";

export type SaveLocalPlanInput = Omit<Plan, "id"> & { id?: string };

function readLocalPlansFromStorage(): Plan[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PLANS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Plan[]) : [];
  } catch {
    return [];
  }
}

function writeLocalPlansToStorage(plans: Plan[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_PLANS_STORAGE_KEY, JSON.stringify(plans));
}

export function getLocalPlans(): Plan[] {
  return readLocalPlansFromStorage();
}

export function getLocalPlanById(planId: string): Plan | undefined {
  return readLocalPlansFromStorage().find((plan) => plan.id === planId);
}

export function saveLocalPlan(plan: SaveLocalPlanInput): Plan {
  const fallbackId = `local-plan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const nextPlan: Plan = {
    ...plan,
    id: plan.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : fallbackId)
  };

  const existing = readLocalPlansFromStorage();
  const filtered = existing.filter((item) => item.id !== nextPlan.id);

  writeLocalPlansToStorage([nextPlan, ...filtered]);
  return nextPlan;
}

export function mergePlansWithLocal(mockPlans: Plan[], localPlans: Plan[]): Plan[] {
  const map = new Map<string, Plan>();

  for (const plan of mockPlans) {
    map.set(plan.id, plan);
  }

  for (const plan of localPlans) {
    map.set(plan.id, plan);
  }

  return [...map.values()];
}

export function appendRecordToLocalPlan(planId: string, record: PlanRecord): void {
  const localPlan = getLocalPlanById(planId);
  if (!localPlan) {
    return;
  }

  const nextRecords = [record, ...localPlan.records.filter((item) => item.id !== record.id)].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const nextCurrentValue =
    localPlan.progress_unit === "不定时"
      ? localPlan.current_value
      : Math.max(localPlan.current_value, nextRecords.length);

  saveLocalPlan({
    ...localPlan,
    updated_at: record.date,
    current_value: nextCurrentValue,
    records: nextRecords
  });
}
