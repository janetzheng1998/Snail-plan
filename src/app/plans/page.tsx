"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PlanCard } from "@/components/plans/plan-card";
import { buttonClasses } from "@/components/ui/button";
import { deleteLocalPlan, getLocalPlans } from "@/lib/local-plans";
import { deleteLocalRecordsByPlanId } from "@/lib/local-records";
import { type Plan } from "@/lib/mock-data";

export default function MyPlansPage() {
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
    () => [...localPlans].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [localPlans]
  );

  const activePlans = mergedPlans.filter((plan) => plan.status === "active" || plan.status === "draft");
  const completedPlans = mergedPlans.filter((plan) => plan.status === "completed");
  const hasAnyPlan = mergedPlans.length > 0;

  const onDeletePlan = (plan: Plan) => {
    const confirmed = window.confirm(`确定删除计划「${plan.title}」吗？删除后不可恢复。`);
    if (!confirmed) {
      return;
    }

    deleteLocalPlan(plan.id);
    deleteLocalRecordsByPlanId(plan.id);
    setLocalPlans(getLocalPlans());
  };

  return (
    <PageShell currentPath="/plans">
      {hasAnyPlan ? (
        <>
          <section className="space-y-4">
            <h3 className="text-2xl text-ink-900">进行中的计划</h3>
            <div className="grid gap-5 md:grid-cols-2">
              {activePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  mode="active"
                  isLocalPlan
                  onDeletePlan={(targetPlan) => onDeletePlan(targetPlan)}
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
                  isLocalPlan
                  onDeletePlan={(targetPlan) => onDeletePlan(targetPlan)}
                />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="flex min-h-[48vh] items-center justify-center rounded-3xl border border-moss-100 bg-white/60 px-6 text-center">
          <p className="flex flex-wrap items-center justify-center gap-2 text-base text-ink-900/72">
            还没有开始计划，点击
            <Link href="/plans/new" className={buttonClasses("primary", "md")}>
              开始新目标
            </Link>
          </p>
        </section>
      )}
    </PageShell>
  );
}
