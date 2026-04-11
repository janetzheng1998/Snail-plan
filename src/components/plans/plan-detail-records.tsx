"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { getLocalRecordsByPlanId, localRecordToPlanRecord } from "@/lib/local-records";
import type { Plan, PlanRecord } from "@/lib/mock-data";

type PlanDetailRecordsProps = {
  plan: Plan;
};

function sortByDateDesc(a: PlanRecord, b: PlanRecord): number {
  if (a.date === b.date) {
    return b.id.localeCompare(a.id);
  }

  return b.date.localeCompare(a.date);
}

export function PlanDetailRecords({ plan }: PlanDetailRecordsProps) {
  const [localRecords, setLocalRecords] = useState<PlanRecord[]>([]);

  useEffect(() => {
    const records = getLocalRecordsByPlanId(plan.id).map(localRecordToPlanRecord);
    setLocalRecords(records);
  }, [plan.id]);

  const mergedRecords = useMemo(() => {
    const recordMap = new Map<string, PlanRecord>();

    for (const record of plan.records) {
      recordMap.set(record.id, record);
    }

    for (const record of localRecords) {
      recordMap.set(record.id, record);
    }

    return [...recordMap.values()].sort(sortByDateDesc);
  }, [localRecords, plan.records]);

  const latestRecord = mergedRecords[0];
  const mockRecordIdSet = useMemo(() => new Set(plan.records.map((record) => record.id)), [plan.records]);

  return (
    <Card className="space-y-4 bg-white/74">
      <CardTitle className="text-xl">档案速览</CardTitle>
      <div className="space-y-2 text-sm text-ink-900/78">
        <p>开始时间：{plan.started_at}</p>
        <p>最近更新：{plan.updated_at}</p>
        <p>累计记录：{mergedRecords.length} 条</p>
        <p>计量方式：{plan.progress_unit}</p>
      </div>

      <div className="rounded-2xl border border-moss-100 bg-moss-50/70 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-900/50">最新片段</p>
        <p className="mt-1 text-sm font-medium text-ink-900/86">{latestRecord?.date ?? "暂无"}</p>
        <p className="mt-1 text-sm leading-6 text-ink-900/75">
          {latestRecord?.organized.completed_content ?? "你的第一条成长记录将在这里出现。"}
        </p>
      </div>

      <div className="space-y-2 rounded-2xl border border-moss-100 bg-white/80 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-900/50">最近记录</p>
        {mergedRecords.length > 0 ? (
          <ul className="space-y-2">
            {mergedRecords.slice(0, 4).map((record) => (
              <li key={record.id} className="rounded-xl border border-moss-100 bg-moss-50/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-ink-900/58">{record.date}</p>
                  {!mockRecordIdSet.has(record.id) ? (
                    <span className="rounded-full border border-moss-300 bg-white px-2 py-0.5 text-[11px] text-moss-700">
                      本地新增
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-ink-900/82">
                  {record.organized.completed_content}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-900/62">
                  原始记录：
                  {record.raw_text.length > 34 ? `${record.raw_text.slice(0, 34)}...` : record.raw_text}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-900/65">还没有记录，点击左侧“新增记录”开始吧。</p>
        )}
      </div>

      <Link href="/" className="text-sm text-moss-700 underline-offset-4 hover:underline">
        返回成长主页
      </Link>
    </Card>
  );
}
