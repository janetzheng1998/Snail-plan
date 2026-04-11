"use client";

import Link from "next/link";
import { AddRecordForm } from "@/components/plans/add-record-form";
import { useResolvedPlan } from "@/components/plans/use-resolved-plan";
import { PageShell } from "@/components/page-shell";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getPlanDetailPath } from "@/lib/plan-routes";

type NewRecordPageContentProps = {
  planId: string;
};

export function NewRecordPageContent({ planId }: NewRecordPageContentProps) {
  const { plan, loading, isLocalPlan } = useResolvedPlan(planId);

  if (loading) {
    return (
      <PageShell currentPath={`/plans/${planId}`}>
        <Card>
          <p className="text-sm text-ink-900/75">正在加载计划信息...</p>
        </Card>
      </PageShell>
    );
  }

  if (!plan) {
    return (
      <PageShell currentPath="/plans">
        <Card className="space-y-3">
          <CardTitle className="text-xl">未找到该计划</CardTitle>
          <p className="text-sm text-ink-900/72">请先创建计划，再开始新增记录。</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/plans/new" className={buttonClasses("primary", "md")}>
              去创建计划
            </Link>
            <Link href="/plans" className={buttonClasses("secondary", "md")}>
              返回我的计划
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell currentPath={getPlanDetailPath(plan.id, isLocalPlan)}>
      <AddRecordForm
        planId={plan.id}
        planTitle={plan.title}
        planDetailPath={getPlanDetailPath(plan.id, isLocalPlan)}
      />
    </PageShell>
  );
}
