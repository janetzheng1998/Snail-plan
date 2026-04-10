import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { ProgressBar } from "@/components/plans/progress-bar";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { getLatestRecord, getPlanById, getProgressPercent } from "@/lib/mock-data";

type PlanDetailPageProps = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function PlanDetailPage({
  params,
  searchParams
}: PlanDetailPageProps) {
  const { planId } = await params;
  const query = await searchParams;
  const plan = getPlanById(planId);

  if (!plan) {
    notFound();
  }

  const percent = getProgressPercent(plan);
  const isCompleted = plan.status === "completed";
  const latestRecord = getLatestRecord(plan);

  return (
    <PageShell currentPath={`/plans/${plan.id}`}>
      {query.saved === "1" ? (
        <Card className="mb-6 border-moss-200 bg-moss-50/85 py-4">
          <p className="text-sm text-moss-700">新记录已收好，继续保持这个节奏就很棒。</p>
        </Card>
      ) : null}

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

        <Card className="space-y-4 bg-white/74">
          <CardTitle className="text-xl">档案速览</CardTitle>
          <div className="space-y-2 text-sm text-ink-900/78">
            <p>开始时间：{plan.started_at}</p>
            <p>最近更新：{plan.updated_at}</p>
            <p>累计记录：{plan.records.length} 条</p>
            <p>计量方式：{plan.progress_unit}</p>
          </div>

          <div className="rounded-2xl border border-moss-100 bg-moss-50/70 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-ink-900/50">最新片段</p>
            <p className="mt-1 text-sm font-medium text-ink-900/86">{latestRecord?.date ?? "暂无"}</p>
            <p className="mt-1 text-sm leading-6 text-ink-900/75">
              {latestRecord?.organized.completed_content ?? "你的第一条成长记录将在这里出现。"}
            </p>
          </div>

          <Link href="/" className="text-sm text-moss-700 underline-offset-4 hover:underline">
            返回成长主页
          </Link>
        </Card>
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
