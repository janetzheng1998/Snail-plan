"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { type PlanRecord, type PlanStatus } from "@/lib/mock-data";

export type CalendarRecord = PlanRecord & {
  planId: string;
  planTitle: string;
  planStatus: PlanStatus;
  summary?: string;
};

type RecordCalendarProps = {
  records: CalendarRecord[];
};

type MonthOption = {
  key: string;
  year: number;
  month: number;
};

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function parseDate(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function formatMonthLabel(year: number, month: number): string {
  return `${year} 年 ${month} 月`;
}

function formatDateLabel(date: string): string {
  const { year, month, day } = parseDate(date);
  return `${year} 年 ${month} 月 ${day} 日`;
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildBriefSummary(record: CalendarRecord): string {
  const source = record.summary?.trim() || record.organized.completed_content.trim() || record.raw_text.trim();
  const normalized = source.replace(/\s+/g, " ");
  return normalized.length > 40 ? `${normalized.slice(0, 40)}...` : normalized;
}

function getMonthOptions(records: CalendarRecord[]): MonthOption[] {
  const unique = new Set(records.map((record) => record.date.slice(0, 7)));
  const sorted = [...unique].sort((a, b) => b.localeCompare(a));

  if (sorted.length === 0) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return [{ key: `${year}-${String(month).padStart(2, "0")}`, year, month }];
  }

  return sorted.map((key) => {
    const [year, month] = key.split("-").map(Number);
    return { key, year, month };
  });
}

function formatDuration(record: CalendarRecord): string {
  return `${record.duration_value}${record.duration_unit}`;
}

function getTotalDurationLabel(records: CalendarRecord[]): string {
  const timeRecords = records.filter(
    (record) => record.duration_unit === "分钟" || record.duration_unit === "小时"
  );

  if (timeRecords.length === 0) {
    return "累计用时 暂无";
  }

  const minutes = timeRecords.reduce((sum, record) => {
    return sum + record.duration_value * (record.duration_unit === "小时" ? 60 : 1);
  }, 0);

  if (minutes >= 60) {
    const hours = (minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1);
    return `累计用时 ${hours} 小时`;
  }

  return `累计用时 ${minutes} 分钟`;
}

export function RecordCalendar({ records }: RecordCalendarProps) {
  const monthOptions = useMemo(() => getMonthOptions(records), [records]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(monthOptions[0].key);

  useEffect(() => {
    if (!monthOptions.some((option) => option.key === selectedMonthKey)) {
      setSelectedMonthKey(monthOptions[0].key);
    }
  }, [monthOptions, selectedMonthKey]);

  const selectedMonth = useMemo(() => {
    return monthOptions.find((option) => option.key === selectedMonthKey) ?? monthOptions[0];
  }, [monthOptions, selectedMonthKey]);

  const recordsInMonth = useMemo(() => {
    return records
      .filter((record) => record.date.startsWith(selectedMonth.key))
      .sort((a, b) => b.date.localeCompare(a.date) || a.planTitle.localeCompare(b.planTitle, "zh-CN"));
  }, [records, selectedMonth.key]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, CalendarRecord[]>();

    recordsInMonth.forEach((record) => {
      const current = map.get(record.date) ?? [];
      current.push(record);
      map.set(record.date, current);
    });

    return map;
  }, [recordsInMonth]);

  const [selectedDate, setSelectedDate] = useState<string>(recordsInMonth[0]?.date ?? "");
  const [showAllRecords, setShowAllRecords] = useState(false);

  useEffect(() => {
    if (!recordsInMonth.some((record) => record.date === selectedDate)) {
      setSelectedDate(recordsInMonth[0]?.date ?? "");
    }
  }, [recordsInMonth, selectedDate]);

  const activeDate = selectedDate || recordsInMonth[0]?.date || "";
  const selectedRecords = activeDate ? recordsByDate.get(activeDate) ?? [] : [];

  useEffect(() => {
    setShowAllRecords(false);
  }, [activeDate]);

  const selectedPlanCount = useMemo(
    () => new Set(selectedRecords.map((record) => record.planId)).size,
    [selectedRecords]
  );
  const selectedTotalDurationLabel = useMemo(() => getTotalDurationLabel(selectedRecords), [selectedRecords]);
  const visibleRecords = showAllRecords ? selectedRecords : selectedRecords.slice(0, 4);
  const hasMoreRecords = selectedRecords.length > 4;

  const firstDay = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month, 0).getDate();
  const recordDaysInMonth = new Set(recordsInMonth.map((record) => record.date)).size;

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="space-y-4 bg-white/78">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">打卡日历</CardTitle>
          </div>

          <select
            value={selectedMonthKey}
            onChange={(event) => {
              const nextMonthKey = event.target.value;
              setSelectedMonthKey(nextMonthKey);

              const firstRecord = records
                .filter((record) => record.date.startsWith(nextMonthKey))
                .sort((a, b) => b.date.localeCompare(a.date))[0];

              setSelectedDate(firstRecord?.date ?? "");
            }}
            className="h-10 rounded-full border border-moss-200 bg-white px-3 text-sm text-ink-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
          >
            {monthOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {formatMonthLabel(option.year, option.month)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <p key={label} className="text-xs font-medium tracking-[0.08em] text-ink-900/48">
              {label}
            </p>
          ))}

          {cells.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} className="h-10" />;
            }

            const dateKey = formatDateKey(selectedMonth.year, selectedMonth.month, day);
            const hasRecord = recordsByDate.has(dateKey);
            const isActive = activeDate === dateKey;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => {
                  if (hasRecord) {
                    setSelectedDate(dateKey);
                  }
                }}
                className={cn(
                  "flex h-10 items-center justify-center rounded-full text-sm transition",
                  hasRecord && "border-2 border-moss-700 bg-moss-700 text-white",
                  !hasRecord && "border border-transparent text-ink-900/36",
                  isActive && "ring-2 ring-moss-300 ring-offset-2 ring-offset-transparent"
                )}
                aria-label={dateKey}
              >
                {day}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-ink-900/68">
          本月已打卡 {recordDaysInMonth} 天，共 {recordsInMonth.length} 条记录。
        </p>
      </Card>

      <Card className="space-y-4 bg-white/74">
        <CardTitle className="text-xl">当日概览</CardTitle>

        {selectedRecords.length > 0 ? (
          <div className="space-y-3">
            <Tag className="border-moss-200 bg-moss-50 text-moss-700">
              {formatDateLabel(selectedRecords[0].date)}
            </Tag>
            <p className="text-sm text-ink-900/72">
              共记录 {selectedRecords.length} 条，{selectedTotalDurationLabel}，涉及 {selectedPlanCount} 个计划。
            </p>

            <div className="space-y-3">
              {visibleRecords.map((record) => (
                <article key={record.id} className="rounded-2xl border border-moss-100 bg-white/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900">{record.planTitle}</p>
                      <Tag className="border-moss-200 bg-moss-50 text-moss-700">
                        {record.planStatus === "draft" ? "草稿" : "计划"}
                      </Tag>
                    </div>
                    <p className="whitespace-nowrap text-xs font-medium text-ink-900/72">
                      {formatDuration(record)}
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-ink-900/76">{buildBriefSummary(record)}</p>
                  <p className="mt-2 text-xs text-ink-900/55">时间：{formatDateLabel(record.date)}</p>

                  <details className="mt-2 text-xs text-ink-900/62">
                    <summary className="cursor-pointer text-moss-700 hover:text-moss-800">
                      查看详情
                    </summary>
                    <div className="mt-2 space-y-2 leading-6">
                      <p>
                        <span className="font-medium text-ink-900">本次完成：</span>
                        {record.organized.completed_content}
                      </p>
                      {record.organized.problems.length > 0 ? (
                        <p>
                          <span className="font-medium text-ink-900">仍需关注：</span>
                          {record.organized.problems.join("；")}
                        </p>
                      ) : null}
                      {record.organized.next_suggestions.length > 0 ? (
                        <p>
                          <span className="font-medium text-ink-900">下次继续：</span>
                          {record.organized.next_suggestions.join("；")}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-medium text-ink-900">原始记录：</span>
                        {record.raw_text}
                      </p>
                    </div>
                  </details>
                </article>
              ))}
            </div>

            {hasMoreRecords ? (
              <button
                type="button"
                onClick={() => setShowAllRecords((value) => !value)}
                className="text-sm text-moss-700 underline-offset-4 hover:underline"
              >
                {showAllRecords ? "收起" : `展开全部（${selectedRecords.length} 条）`}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-7 text-ink-900/78">这个月份还没有记录。换个有打卡的月份试试看。</p>
        )}
      </Card>
    </div>
  );
}
