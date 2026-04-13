"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getLocalPlanById, saveLocalPlan } from "@/lib/local-plans";
import { getPlanById, planCategories, progressUnits, type Plan, type PlanStatus } from "@/lib/mock-data";
import { getPlanNewRecordPath } from "@/lib/plan-routes";
import { cn } from "@/lib/utils";

const DEFAULT_PLAN_NAME = "声乐课学习（10节）";
const DEFAULT_PLAN_CYCLE = "未来 10 周";
const DEFAULT_DESCRIPTION = "开始记录吧";

function getLocalDateString(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function splitDescriptionAndCycle(rawDescription: string): { description: string; cycle: string } {
  const lines = rawDescription.split("\n");
  const cycleLineIndex = lines.findIndex((line) => line.trim().startsWith("周期："));

  if (cycleLineIndex < 0) {
    return { description: rawDescription, cycle: "" };
  }

  const cycle = lines[cycleLineIndex].trim().replace(/^周期：/, "").trim();
  const description = lines.filter((_, index) => index !== cycleLineIndex).join("\n").trim();

  return {
    description: description || DEFAULT_DESCRIPTION,
    cycle
  };
}

function composeDescriptionWithCycle(description: string, cycle: string): string {
  const normalizedDescription = description.trim() || DEFAULT_DESCRIPTION;
  const normalizedCycle = cycle.trim();

  return normalizedCycle
    ? `${normalizedDescription}\n周期：${normalizedCycle}`
    : normalizedDescription;
}

export function NewPlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingPlanId = (searchParams.get("planId") ?? "").trim();

  const [planName, setPlanName] = useState(DEFAULT_PLAN_NAME);
  const [planCycle, setPlanCycle] = useState(DEFAULT_PLAN_CYCLE);
  const [category, setCategory] = useState<(typeof planCategories)[number]>("学习提升");
  const [targetValue, setTargetValue] = useState<number>(10);
  const [unit, setUnit] = useState<(typeof progressUnits)[number]>("次");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [statusHint, setStatusHint] = useState("");
  const [resolvedEditingPlan, setResolvedEditingPlan] = useState<Plan>();
  const isFlexiblePlan = unit === "不定时";
  const isEditMode = Boolean(resolvedEditingPlan);

  useEffect(() => {
    if (!editingPlanId) {
      setResolvedEditingPlan(undefined);
      setPlanName(DEFAULT_PLAN_NAME);
      setPlanCycle(DEFAULT_PLAN_CYCLE);
      setCategory("学习提升");
      setTargetValue(10);
      setUnit("次");
      setDescription(DEFAULT_DESCRIPTION);
      setStatusHint("");
      return;
    }

    const plan = getLocalPlanById(editingPlanId) ?? getPlanById(editingPlanId);

    if (!plan) {
      setResolvedEditingPlan(undefined);
      setStatusHint("未找到要编辑的计划，已切换为新建模式。");
      return;
    }

    const { description: parsedDescription, cycle } = splitDescriptionAndCycle(plan.description);

    setResolvedEditingPlan(plan);
    setPlanName(plan.title);
    setPlanCycle(cycle || DEFAULT_PLAN_CYCLE);
    setCategory(plan.category);
    setTargetValue(Math.max(1, plan.target_value));
    setUnit(plan.progress_unit);
    setDescription(parsedDescription);
    setStatusHint("");
  }, [editingPlanId]);

  const previewText = useMemo(() => {
    const goalText = isFlexiblePlan ? "不定时" : `${targetValue}${unit}`;
    return `${planName} · 目标 ${goalText} · 周期 ${planCycle}`;
  }, [isFlexiblePlan, planCycle, planName, targetValue, unit]);

  const persistPlan = (status: PlanStatus): Plan => {
    const localDate = getLocalDateString();
    const fallbackPlan = resolvedEditingPlan;

    return saveLocalPlan({
      id: fallbackPlan?.id,
      title: planName.trim() || "未命名计划",
      category,
      description: composeDescriptionWithCycle(description, planCycle),
      status,
      started_at: fallbackPlan?.started_at ?? localDate,
      updated_at: localDate,
      completed_at: status === "completed" ? localDate : undefined,
      target_value: isFlexiblePlan ? 1 : Math.max(1, targetValue),
      current_value: fallbackPlan?.current_value ?? 0,
      progress_unit: unit,
      records: fallbackPlan?.records ?? []
    });
  };

  const navigateWithFallback = (nextPath: string) => {
    router.push(nextPath);

    window.setTimeout(() => {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (currentPath !== nextPath) {
        window.location.assign(nextPath);
      }
    }, 700);
  };

  const onSaveDraft = () => {
    persistPlan("draft");
    setStatusHint(isEditMode ? "草稿已更新，正在返回我的计划..." : "草稿已保存，正在返回我的计划...");

    window.setTimeout(() => {
      navigateWithFallback("/plans");
    }, 220);
  };

  const onCreateAndContinue = () => {
    const nextPlan = persistPlan("active");
    const nextPath = getPlanNewRecordPath(nextPlan.id, true);

    setStatusHint(
      isEditMode ? "计划已更新，正在进入记录页..." : "计划已创建，正在进入记录页..."
    );

    window.setTimeout(() => {
      navigateWithFallback(nextPath);
    }, 220);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-6 bg-white/78">
        <div className="space-y-2">
          <CardTitle className="text-xl">{isEditMode ? "编辑计划" : "创建新计划"}</CardTitle>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink-900/84">计划名称</span>
            <input
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              placeholder="例如：声乐课学习（10节）"
              className="h-12 w-full rounded-2xl border border-white bg-white/92 px-4 text-base text-ink-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
            />
          </label>
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
          <Button type="button" size="lg" variant="secondary" onClick={onSaveDraft}>
            {isEditMode ? "更新草稿" : "保存草稿"}
          </Button>
          <Button type="button" size="lg" onClick={onCreateAndContinue}>
            {isEditMode ? "更新并继续" : "创建并开始记录"}
          </Button>
          <Link href="/" className={buttonClasses("ghost", "lg")}>
            回到成长主页
          </Link>
        </div>

        {statusHint ? <p className="text-sm text-moss-700">{statusHint}</p> : null}
      </Card>
    </div>
  );
}
