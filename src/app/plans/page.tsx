"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PlanCard } from "@/components/plans/plan-card";
import { getLocalPlans, mergePlansWithLocal } from "@/lib/local-plans";
import { getActivePlans, getCompletedPlans, type Plan } from "@/lib/mock-data";

export default function MyPlansPage() {
  const mockActivePlans = getActivePlans();
  const mockCompletedPlans = getCompletedPlans();
  const mockPlans = useMemo(() => [...mockActivePlans, ...mockCompletedPlans], [mockActivePlans, mockCompletedPlans]);
  const [localPlans, setLocalPlans] = useState<Plan[]>([]);

  useEffect(() => {
    setLocalPlans(getLocalPlans());

    const onStorage = () => {
      setLocalPlans(getLocalPlans());
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const mergedPlans = useMemo(
    () =>
      mergePlansWithLocal(mockPlans, localPlans).sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [localPlans, mockPlans]
  );

  const activePlans = mergedPlans.filter((plan) => plan.status === "active");
  const completedPlans = mergedPlans.filter((plan) => plan.status === "completed");

  return (
    <PageShell currentPath="/plans">
      <section className="space-y-4">
        <h3 className="text-2xl text-ink-900">进行中的计划</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {activePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} mode="active" />
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <h3 className="text-2xl text-ink-900">已完成的计划</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {completedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} mode="completed" />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
