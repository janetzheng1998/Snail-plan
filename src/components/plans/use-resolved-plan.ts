"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalPlanById } from "@/lib/local-plans";
import { getPlanById, type Plan } from "@/lib/mock-data";

type UseResolvedPlanResult = {
  plan?: Plan;
  loading: boolean;
  isLocalPlan: boolean;
};

export function useResolvedPlan(planId?: string): UseResolvedPlanResult {
  const normalizedPlanId = planId?.trim() ?? "";
  const mockPlan = useMemo(
    () => (normalizedPlanId ? getPlanById(normalizedPlanId) : undefined),
    [normalizedPlanId]
  );
  const [localPlan, setLocalPlan] = useState<Plan>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!normalizedPlanId) {
      setLocalPlan(undefined);
      setHydrated(true);
      return;
    }

    setLocalPlan(getLocalPlanById(normalizedPlanId));
    setHydrated(true);
  }, [normalizedPlanId]);

  return {
    plan: localPlan ?? mockPlan,
    loading: !hydrated && !mockPlan,
    isLocalPlan: Boolean(localPlan)
  };
}
