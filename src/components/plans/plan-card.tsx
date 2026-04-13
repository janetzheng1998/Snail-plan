import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { buttonClasses } from "@/components/ui/button";
import {
  getPlanDetailPath,
  getPlanEditPath,
  getPlanNewRecordPath,
  getPlanSummaryPath
} from "@/lib/plan-routes";
import {
  type Plan,
  getLatestRecord,
  getPlanCompletionDate,
  getProgressPercent
} from "@/lib/mock-data";
import { ProgressBar } from "@/components/plans/progress-bar";

type PlanCardProps = {
  plan: Plan;
  mode?: "active" | "completed";
  isLocalPlan?: boolean;
  onDeletePlan?: (plan: Plan, isLocalPlan: boolean) => void;
};

export function PlanCard({ plan, mode, isLocalPlan = false, onDeletePlan }: PlanCardProps) {
  const latestRecord = getLatestRecord(plan);
  const percent = getProgressPercent(plan);
  const resolvedMode = mode ?? (plan.status === "completed" ? "completed" : "active");
  const completionDate = getPlanCompletionDate(plan);
  const detailPath = getPlanDetailPath(plan.id, isLocalPlan);
  const newRecordPath = getPlanNewRecordPath(plan.id, isLocalPlan);
  const summaryPath = getPlanSummaryPath(plan.id, isLocalPlan);
  const editPath = getPlanEditPath(plan.id);
  const showDraftTag = plan.status === "draft";

  if (resolvedMode === "completed") {
    return (
      <Card className="space-y-4 bg-white/75">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="border-clay-500 bg-clay-100 text-clay-500">已完成</Tag>
          <Tag>{plan.category}</Tag>
          {showDraftTag ? <Tag className="border-moss-300 bg-moss-50 text-moss-700">草稿</Tag> : null}
        </div>

        <div className="space-y-1">
          <CardTitle className="text-xl">{plan.title}</CardTitle>
        </div>

        <div className="rounded-2xl border border-moss-100 bg-moss-50/65 px-4 py-3 text-sm text-ink-900/80">
          累计完成：{plan.current_value}/{plan.target_value}
          {plan.progress_unit}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={summaryPath} className={buttonClasses("primary", "md")}>
            查看阶段总结
          </Link>
          <Link href={detailPath} className={buttonClasses("ghost", "md")}>
            打开成长档案
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={editPath} className={buttonClasses("secondary", "md")}>
            编辑
          </Link>
          <button
            type="button"
            onClick={() => onDeletePlan?.(plan, isLocalPlan)}
            className={buttonClasses("ghost", "md")}
          >
            删除
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 border-moss-100 bg-gradient-to-br from-white to-moss-50/80">
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{plan.category}</Tag>
        <Tag className={showDraftTag ? "border-moss-300 bg-moss-50 text-moss-700" : "border-moss-600 bg-moss-100 text-moss-700"}>
          {showDraftTag ? "草稿" : "进行中"}
        </Tag>
      </div>

      <div className="space-y-1">
        <CardTitle className="text-2xl leading-tight">{plan.title}</CardTitle>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink-900/85">
          已完成 {plan.current_value}/{plan.target_value}
          {plan.progress_unit}（{percent}%）
        </p>
        <ProgressBar percent={percent} />
      </div>

      <article className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3">
        <p className="text-xs tracking-[0.14em] text-ink-900/52">最近进展</p>
        <p className="mt-1 text-sm font-medium text-ink-900/88">{latestRecord?.date ?? "暂无记录"}</p>
        <p className="mt-1 text-sm leading-6 text-ink-900/78">
          {latestRecord?.organized.completed_content ?? "开始记录你的第一个成长片段吧。"}
        </p>
      </article>

      <div className="flex flex-wrap gap-2">
        <Link href={newRecordPath} className={buttonClasses("primary", "md")}>
          继续记录
        </Link>
        <Link href={detailPath} className={buttonClasses("secondary", "md")}>
          查看档案
        </Link>
        <Link href={editPath} className={buttonClasses("ghost", "md")}>
          编辑
        </Link>
        <button
          type="button"
          onClick={() => onDeletePlan?.(plan, isLocalPlan)}
          className={buttonClasses("ghost", "md")}
        >
          删除
        </button>
      </div>
    </Card>
  );
}
