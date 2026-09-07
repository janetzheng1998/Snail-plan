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

function getCurrentBlocks(record: PlanRecord): string[] {
  return record.organized.current_blocks?.length
    ? record.organized.current_blocks
    : record.organized.problems;
}

function getCleanedRawText(record: PlanRecord): string {
  return record.organized.cleaned_raw_text?.trim() || record.raw_text;
}

export function PlanDetailRecords({ plan }: PlanDetailRecordsProps) {
  const [localRecords, setLocalRecords] = useState<PlanRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");

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
  const selectedRecord = mergedRecords.find((record) => record.id === selectedRecordId) ?? latestRecord;
  const mockRecordIdSet = useMemo(() => new Set(plan.records.map((record) => record.id)), [plan.records]);

  useEffect(() => {
    if (!selectedRecordId && latestRecord) {
      setSelectedRecordId(latestRecord.id);
    }
  }, [latestRecord, selectedRecordId]);

  return (
    <Card className="space-y-4 bg-white/74">
      <CardTitle className="text-xl">档案速览</CardTitle>
      <div className="space-y-2 text-sm text-ink-900/78">
        <p>开始时间：{plan.started_at}</p>
        <p>最近更新：{plan.updated_at}</p>
        <p>累计记录：{mergedRecords.length} 条</p>
        <p>计量方式：{plan.progress_unit}</p>
      </div>

      <button
        type="button"
        onClick={() => latestRecord && setSelectedRecordId(latestRecord.id)}
        className="w-full rounded-2xl border border-moss-100 bg-moss-50/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-moss-300 hover:bg-moss-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
      >
        <p className="text-xs uppercase tracking-[0.14em] text-ink-900/50">最新片段</p>
        <p className="mt-1 text-sm font-medium text-ink-900/86">{latestRecord?.date ?? "暂无"}</p>
        <p className="mt-1 text-sm leading-6 text-ink-900/75">
          {latestRecord?.organized.summary ??
            latestRecord?.organized.completed_content ??
            "你的第一条成长记录将在这里出现。"}
        </p>
        {latestRecord ? <p className="mt-2 text-xs text-moss-700">点击查看完整记录</p> : null}
      </button>

      <div className="space-y-2 rounded-2xl border border-moss-100 bg-white/80 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-900/50">最近记录</p>
        {mergedRecords.length > 0 ? (
          <ul className="space-y-2">
            {mergedRecords.slice(0, 4).map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRecordId(record.id)}
                  className={[
                    "w-full rounded-xl border p-2 text-left transition hover:border-moss-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300",
                    selectedRecord?.id === record.id
                      ? "border-moss-300 bg-moss-50"
                      : "border-moss-100 bg-moss-50/60"
                  ].join(" ")}
                >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-ink-900/58">{record.date}</p>
                  {!mockRecordIdSet.has(record.id) ? (
                    <span className="rounded-full border border-moss-300 bg-white px-2 py-0.5 text-[11px] text-moss-700">
                      本地新增
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-ink-900/82">
                  {record.organized.summary ?? record.organized.completed_content}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-900/62">
                  点击查看这次记录的完整复盘
                </p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-900/65">还没有记录，点击左侧“新增记录”开始吧。</p>
        )}
      </div>

      {selectedRecord ? (
        <div className="space-y-4 rounded-2xl border border-moss-200 bg-white/88 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-ink-900/46">记录详情</p>
              <p className="mt-1 text-lg font-medium text-ink-900">{selectedRecord.date}</p>
            </div>
            <span className="rounded-full border border-moss-200 bg-moss-50 px-3 py-1 text-xs text-moss-700">
              {selectedRecord.duration_value}
              {selectedRecord.duration_unit}
            </span>
          </div>

          <div className="space-y-3 text-sm leading-7 text-ink-900/78">
            {selectedRecord.organized.summary ? (
              <section className="border-t border-moss-100 pt-3">
                <h4 className="mb-1 text-sm font-semibold text-ink-900">一句话复盘</h4>
                <p>{selectedRecord.organized.summary}</p>
              </section>
            ) : null}

            <section className="border-t border-moss-100 pt-3">
              <h4 className="mb-1 text-sm font-semibold text-ink-900">本次进展</h4>
              <p>{selectedRecord.organized.completed_content}</p>
            </section>

            {selectedRecord.organized.key_findings?.length ? (
              <section className="border-t border-moss-100 pt-3">
                <h4 className="mb-1 text-sm font-semibold text-ink-900">关键发现</h4>
                <ul className="list-disc space-y-1 pl-5">
                  {selectedRecord.organized.key_findings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="border-t border-moss-100 pt-3">
              <h4 className="mb-1 text-sm font-semibold text-ink-900">当前卡点</h4>
              <ul className="list-disc space-y-1 pl-5">
                {getCurrentBlocks(selectedRecord).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            {selectedRecord.organized.possible_reasons?.length ? (
              <section className="border-t border-moss-100 pt-3">
                <h4 className="mb-1 text-sm font-semibold text-ink-900">可能原因</h4>
                <ul className="list-disc space-y-1 pl-5">
                  {selectedRecord.organized.possible_reasons.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="border-t border-moss-100 pt-3">
              <h4 className="mb-1 text-sm font-semibold text-ink-900">下一步建议</h4>
              <ul className="list-disc space-y-1 pl-5">
                {selectedRecord.organized.next_suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            {selectedRecord.organized.record_reminders?.length ? (
              <section className="border-t border-moss-100 pt-3">
                <h4 className="mb-1 text-sm font-semibold text-ink-900">下次记录提醒</h4>
                <ul className="list-disc space-y-1 pl-5">
                  {selectedRecord.organized.record_reminders.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <details className="border-t border-moss-100 pt-3">
              <summary className="cursor-pointer text-sm text-ink-900/62 hover:text-moss-700">
                展开原始记录
              </summary>
              <p className="mt-2 rounded-xl bg-moss-50/60 p-3 text-ink-900/68">
                {getCleanedRawText(selectedRecord)}
              </p>
            </details>
          </div>
        </div>
      ) : null}

      <Link href="/" className="text-sm text-moss-700 underline-offset-4 hover:underline">
        返回成长主页
      </Link>
    </Card>
  );
}
