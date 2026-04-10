import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import {
  getPlanById,
  getPlanCompletionDate,
  getPlanSummaryById,
  getProgressPercent
} from "@/lib/mock-data";

type PlanSummaryPageProps = {
  params: Promise<{ planId: string }>;
};

export default async function PlanSummaryPage({ params }: PlanSummaryPageProps) {
  const { planId } = await params;
  const plan = getPlanById(planId);

  if (!plan) {
    notFound();
  }

  const summary = getPlanSummaryById(plan.id);
  const percent = getProgressPercent(plan);
  const completionDate = getPlanCompletionDate(plan);

  return (
    <PageShell currentPath={`/plans/${plan.id}`}>
      <section className="space-y-6">
        <Card className="overflow-hidden bg-gradient-to-br from-moss-50 via-white to-clay-100/70 p-0">
          <div className="space-y-4 p-7 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="border-clay-500 bg-clay-100 text-clay-500">阶段完成</Tag>
              <Tag>{completionDate}</Tag>
            </div>

            <h3 className="text-3xl leading-tight text-ink-900 sm:text-4xl">{plan.title}</h3>
            <p className="max-w-3xl text-sm leading-7 text-ink-900/76">{summary.completion_note}</p>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="rounded-2xl bg-white/82 p-4">
                <p className="text-xs tracking-[0.16em] text-ink-900/50">完成度</p>
                <p className="mt-1 text-3xl font-semibold text-ink-900">{percent}%</p>
              </Card>
              <Card className="rounded-2xl bg-white/82 p-4">
                <p className="text-xs tracking-[0.16em] text-ink-900/50">累计记录</p>
                <p className="mt-1 text-3xl font-semibold text-ink-900">{plan.records.length}</p>
              </Card>
              <Card className="rounded-2xl bg-white/82 p-4">
                <p className="text-xs tracking-[0.16em] text-ink-900/50">目标达成</p>
                <p className="mt-1 text-3xl font-semibold text-ink-900">
                  {plan.current_value}/{plan.target_value}
                  {plan.progress_unit}
                </p>
              </Card>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3 bg-white/75">
            <CardTitle className="text-xl">这段时间你收获了什么</CardTitle>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-ink-900/82">
              {summary.key_gains.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 bg-white/75">
            <CardTitle className="text-xl">仍在反复出现的问题</CardTitle>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-ink-900/82">
              {summary.recurring_issues.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="space-y-4 bg-white/74">
          <CardTitle className="text-xl">下一阶段建议</CardTitle>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-ink-900/82">
            {summary.next_phase_actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="rounded-2xl border border-moss-100 bg-moss-50/70 px-4 py-3">
            <p className="text-sm leading-7 text-ink-900/80">{summary.final_reflection}</p>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link href={`/plans/${plan.id}`} className={buttonClasses("secondary", "lg")}>
            返回计划档案
          </Link>
          <Link href="/" className={buttonClasses("primary", "lg")}>
            回到成长主页
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
