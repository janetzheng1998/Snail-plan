"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalPlanById } from "@/lib/local-plans";
import { getPlanById, type Plan } from "@/lib/mock-data";

type UseResolvedPlanResult = {
  plan?: Plan;
  loading: boolean;
  isLocalPlan: boolean;
};

export function useResolvedPlan(planId: string): UseResolvedPlanResult {
  const mockPlan = useMemo(() => getPlanById(planId), [planId]);
  const [localPlan, setLocalPlan] = useState<Plan>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocalPlan(getLocalPlanById(planId));
    setHydrated(true);
  }, [planId]);

  return {
    plan: localPlan ?? mockPlan,
    loading: !hydrated && !mockPlan,
    isLocalPlan: Boolean(localPlan)
  };
}
