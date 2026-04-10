"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { type PlanRecord } from "@/lib/mock-data";

type RecordCalendarProps = {
  records: PlanRecord[];
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

function getRecordOrderMap(records: PlanRecord[]): Map<string, number> {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const map = new Map<string, number>();

  sorted.forEach((record, index) => {
    map.set(record.id, index + 1);
  });

  return map;
}

function buildDailySummary(record: PlanRecord): string {
  const completedText = record.organized.completed_content.replace(/[。！!]+$/, "");
  const firstIssue = record.organized.problems[0];

  if (firstIssue) {
    return `今天${completedText}，仍需继续关注：${firstIssue}。`;
  }

  return `今天${completedText}。`;
}

function getMonthOptions(records: PlanRecord[]): MonthOption[] {
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

export function RecordCalendar({ records }: RecordCalendarProps) {
  const monthOptions = useMemo(() => getMonthOptions(records), [records]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(monthOptions[0].key);

  const selectedMonth = useMemo(() => {
    return monthOptions.find((option) => option.key === selectedMonthKey) ?? monthOptions[0];
  }, [monthOptions, selectedMonthKey]);

  const recordsInMonth = useMemo(() => {
    return records
      .filter((record) => record.date.startsWith(selectedMonth.key))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, selectedMonth.key]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, PlanRecord[]>();

    recordsInMonth.forEach((record) => {
      const current = map.get(record.date) ?? [];
      current.push(record);
      map.set(record.date, current);
    });

    return map;
  }, [recordsInMonth]);
  const recordOrderMap = useMemo(() => getRecordOrderMap(records), [records]);

  const [selectedDate, setSelectedDate] = useState<string>(recordsInMonth[0]?.date ?? "");

  const activeDate = selectedDate || recordsInMonth[0]?.date || "";
  const selectedRecords = activeDate ? recordsByDate.get(activeDate) ?? [] : [];

  const firstDay = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month, 0).getDate();

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
                  "flex h-10 items-center justify-center rounded-full text-sm",
                  hasRecord && "border-2 border-moss-700 bg-moss-700 text-white",
                  !hasRecord && "border border-transparent text-ink-900/36"
                )}
                aria-label={dateKey}
              >
                {day}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-ink-900/68">
          本月已打卡 {recordsInMonth.length} 天，共 {recordsInMonth.length} 条记录。
        </p>
      </Card>

      <Card className="space-y-4 bg-white/74">
        <CardTitle className="text-xl">当日记录</CardTitle>

        {selectedRecords.length > 0 ? (
          <div className="space-y-4">
            <Tag className="border-moss-200 bg-moss-50 text-moss-700">
              {formatDateLabel(selectedRecords[0].date)}
            </Tag>

            {selectedRecords.map((record) => (
              <article key={record.id} className="space-y-4 rounded-2xl border border-moss-100 bg-white/78 p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink-900/84">
                    第 {recordOrderMap.get(record.id) ?? "-"} 次记录 · {record.duration_value}
                    {record.duration_unit}
                  </p>
                  <p className="text-sm leading-7 text-ink-900/76">{buildDailySummary(record)}</p>
                </div>

                <div className="space-y-4 text-sm leading-7 text-ink-900/82">
                  <section className="border-t border-moss-100 pt-4">
                    <h4 className="text-sm font-semibold text-ink-900">本次完成</h4>
                    <p className="mt-1">{record.organized.completed_content}</p>
                  </section>

                  <section className="border-t border-moss-100 pt-4">
                    <h4 className="text-sm font-semibold text-ink-900">仍需关注</h4>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {record.organized.problems.map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="border-t border-moss-100 pt-4">
                    <h4 className="text-sm font-semibold text-ink-900">下次怎么继续</h4>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {record.organized.next_suggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <details className="pt-1 text-sm text-ink-900/58">
                  <summary className="cursor-pointer text-sm text-ink-900/56 hover:text-ink-900/72">
                    展开原始记录
                  </summary>
                  <p className="mt-2 rounded-xl border border-moss-100 bg-white/85 px-3 py-2 leading-6 text-ink-900/74">
                    {record.raw_text}
                  </p>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-7 text-ink-900/78">这个月份还没有记录。换个有打卡的月份试试看。</p>
        )}
      </Card>
    </div>
  );
}
