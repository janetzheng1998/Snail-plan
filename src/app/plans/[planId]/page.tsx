import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PlanDetailRecords } from "@/components/plans/plan-detail-records";
import { ProgressBar } from "@/components/plans/progress-bar";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { getPlanById, getProgressPercent } from "@/lib/mock-data";

type PlanDetailPageProps = {
  params: Promise<{ planId: string }>;
};

export function generateStaticParams() {
  return [
    { planId: "voice-lesson-10" },
    { planId: "morning-expression-30" },
    { planId: "running-endurance-20h" },
    { planId: "prompt-writing-15" },
  ];
}

export default async function PlanDetailPage({
  params
}: PlanDetailPageProps) {
  const { planId } = await params;
  const plan = getPlanById(planId);

  if (!plan) {
    notFound();
  }

  const percent = getProgressPercent(plan);
  const isCompleted = plan.status === "completed";

  return (
    <PageShell currentPath={`/plans/${plan.id}`}>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">
        <Card className="space-y-5 bg-gradient-to-br from-white to-moss-50/70">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{plan.category}</Tag>
            <Tag className={isCompleted ? "border-clay-500 bg-clay-100 text-clay-500" : ""}>
              {isCompleted ? "已完成" : "进行中"}
            </Tag>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl leading-tight">{plan.title}</CardTitle>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-900/86">
              当前进度 {plan.current_value}/{plan.target_value}
              {plan.progress_unit}（{percent}%）
            </p>
            <ProgressBar percent={percent} />
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={`/plans/${plan.id}/records/new`} className={buttonClasses("primary", "lg")}>
              新增记录
            </Link>
            <Link href={`/plans/${plan.id}/summary`} className={buttonClasses("secondary", "lg")}>
              {isCompleted ? "查看计划总结" : "标记完成并生成总结"}
            </Link>
          </div>
        </Card>

        <PlanDetailRecords plan={plan} />
      </section>

      <section className="mt-8">
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-white/75">
          <h3 className="text-xl text-ink-900">成长日历</h3>
          <Link href="/calendar" className={buttonClasses("secondary", "md")}>
            打开日历
          </Link>
        </Card>
      </section>
    </PageShell>
  );
}
