"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PlanCard } from "@/components/plans/plan-card";
import { deleteLocalPlan, getLocalPlans, mergePlansWithLocal } from "@/lib/local-plans";
import { deleteLocalRecordsByPlanId } from "@/lib/local-records";
import { plans as mockPlans, type Plan } from "@/lib/mock-data";

const HIDDEN_MOCK_PLAN_IDS_KEY = "snail-plan-hidden-mock-plan-ids";

export default function MyPlansPage() {
  const [localPlans, setLocalPlans] = useState<Plan[]>([]);
  const [hiddenMockPlanIds, setHiddenMockPlanIds] = useState<string[]>([]);

  useEffect(() => {
    setLocalPlans(getLocalPlans());
    try {
      const parsed = JSON.parse(window.localStorage.getItem(HIDDEN_MOCK_PLAN_IDS_KEY) ?? "[]");
      setHiddenMockPlanIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHiddenMockPlanIds([]);
    }

    const onStorage = () => {
      setLocalPlans(getLocalPlans());
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const visibleMockPlans = useMemo(
    () => mockPlans.filter((plan) => !hiddenMockPlanIds.includes(plan.id)),
    [hiddenMockPlanIds]
  );

  const mergedPlans = useMemo(
    () =>
      mergePlansWithLocal(visibleMockPlans, localPlans).sort((a, b) =>
        b.updated_at.localeCompare(a.updated_at)
      ),
    [localPlans, visibleMockPlans]
  );
  const localPlanIdSet = useMemo(() => new Set(localPlans.map((plan) => plan.id)), [localPlans]);

  const activePlans = mergedPlans.filter((plan) => plan.status === "active" || plan.status === "draft");
  const completedPlans = mergedPlans.filter((plan) => plan.status === "completed");

  const onDeletePlan = (plan: Plan, isLocalPlan: boolean) => {
    const confirmed = window.confirm(`确定删除计划「${plan.title}」吗？删除后不可恢复。`);
    if (!confirmed) {
      return;
    }

    if (isLocalPlan) {
      deleteLocalPlan(plan.id);
      deleteLocalRecordsByPlanId(plan.id);
      setLocalPlans(getLocalPlans());
      return;
    }

    const nextHiddenIds = [...new Set([...hiddenMockPlanIds, plan.id])];
    setHiddenMockPlanIds(nextHiddenIds);
    window.localStorage.setItem(HIDDEN_MOCK_PLAN_IDS_KEY, JSON.stringify(nextHiddenIds));
  };

  return (
    <PageShell currentPath="/plans">
      <section className="space-y-4">
        <h3 className="text-2xl text-ink-900">进行中的计划</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              mode="active"
              isLocalPlan={localPlanIdSet.has(plan.id)}
              onDeletePlan={onDeletePlan}
            />
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <h3 className="text-2xl text-ink-900">已完成的计划</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {completedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              mode="completed"
              isLocalPlan={localPlanIdSet.has(plan.id)}
              onDeletePlan={onDeletePlan}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
