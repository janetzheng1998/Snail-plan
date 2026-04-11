"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { planCategories, progressUnits } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function NewPlanForm() {
  const router = useRouter();
  const [planName, setPlanName] = useState("声乐课学习（10节）");
  const [planCycle, setPlanCycle] = useState("未来 10 周");
  const [category, setCategory] = useState<(typeof planCategories)[number]>("学习提升");
  const [targetValue, setTargetValue] = useState<number>(10);
  const [unit, setUnit] = useState<(typeof progressUnits)[number]>("次");
  const [description, setDescription] = useState(
    "开始记录吧"
  );
  const [created, setCreated] = useState(false);
  const isFlexiblePlan = unit === "不定时";

  const previewText = useMemo(() => {
    const goalText = isFlexiblePlan ? "不定时" : `${targetValue}${unit}`;
    return `${planName} · 目标 ${goalText} · 周期 ${planCycle}`;
  }, [isFlexiblePlan, planCycle, planName, targetValue, unit]);

  const onCreate = () => {
    const nextPath = "/plans/voice-lesson-10/records/new";
    setCreated(true);

    setTimeout(() => {
      router.push(nextPath);

      // Netlify 某些静态部署场景下可能出现客户端路由未生效，补一个硬跳转兜底。
      window.setTimeout(() => {
        if (window.location.pathname === "/plans/new") {
          window.location.assign(nextPath);
        }
      }, 650);
    }, 240);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-6 bg-white/78">
        <div className="space-y-2">
          <CardTitle className="text-xl">计划名称</CardTitle>
          <input
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
            placeholder="例如：声乐课学习（10节）"
            className="h-12 w-full rounded-2xl border border-white bg-white/92 px-4 text-base text-ink-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink-900/84">目标量</span>
            <div className="flex items-center gap-2 rounded-2xl border border-white bg-white/92 px-3 py-2 shadow-sm">
              <input
                type="number"
                min={1}
                value={targetValue}
                disabled={isFlexiblePlan}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value > 0) {
                    setTargetValue(value);
                  }
                }}
                className={cn(
                  "h-9 w-24 rounded-xl border border-moss-100 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300",
                  isFlexiblePlan && "cursor-not-allowed bg-ink-900/5 text-ink-900/45"
                )}
              />
              <div className="flex flex-wrap gap-2">
                {progressUnits.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setUnit(item)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition",
                      item === unit
                        ? "border-moss-700 bg-moss-700 text-white"
                        : "border-moss-200 bg-white text-ink-900/72 hover:border-moss-400"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            {isFlexiblePlan ? (
              <p className="text-xs text-ink-900/58">
                不定时计划不设固定目标量，完成时你可以手动标记为已完成。
              </p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-ink-900/84">周期</span>
            <input
              value={planCycle}
              onChange={(event) => setPlanCycle(event.target.value)}
              placeholder="例如：未来 10 周"
              className="h-12 w-full rounded-2xl border border-white bg-white/92 px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-900/84">目标类型</p>
          <div className="flex flex-wrap gap-2">
            {planCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  item === category
                    ? "border-moss-700 bg-moss-700 text-white"
                    : "border-moss-200 bg-white text-ink-900/76 hover:border-moss-400"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <label className="space-y-2">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24 w-full rounded-2xl border border-white bg-white/92 px-4 py-3 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
          />
        </label>

        <div className="rounded-2xl border border-moss-100 bg-moss-50/70 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-moss-700">计划预览</p>
          <p className="mt-2 text-sm text-ink-900/82">{previewText}</p>
          <p className="mt-1 text-sm text-ink-900/72">类型：{category}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" size="lg" onClick={onCreate}>
            创建并开始记录
          </Button>
          <Link href="/" className={buttonClasses("ghost", "lg")}>
            回到成长主页
          </Link>
        </div>

        {created ? (
          <p className="text-sm text-moss-700">已为你生成计划草稿，正在进入记录页。</p>
        ) : null}
      </Card>
    </div>
  );
}
