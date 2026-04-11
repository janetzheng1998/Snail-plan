"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { TextArea } from "@/components/ui/text-area";
import { getLocalRecordsByPlanId, saveLocalRecord } from "@/lib/local-records";
import { mockOrganizedRecord, recordUnits } from "@/lib/mock-data";

type AddRecordFormProps = {
  planId: string;
  planTitle: string;
};

export function AddRecordForm({ planId, planTitle }: AddRecordFormProps) {
  const router = useRouter();
  const [rawInput, setRawInput] = useState("");
  const [durationValue, setDurationValue] = useState(60);
  const [durationUnit, setDurationUnit] = useState<(typeof recordUnits)[number]>("分钟");
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const onOrganize = () => {
    if (!rawInput.trim()) {
      setRawInput(
        "今天训练了 60 分钟，前半段进入状态慢，中段有分心，但后面通过分解练习把核心问题找出来了。"
      );
    }
    setGenerated(true);
  };

  const onSave = () => {
    const fallbackRawText =
      "今天训练了 60 分钟，前半段进入状态慢，中段有分心，但后面通过分解练习把核心问题找出来了。";
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);

    try {
      const savedRecord = saveLocalRecord({
        planId,
        date: localDate,
        rawText: rawInput.trim() || fallbackRawText,
        durationValue,
        durationUnit,
        organized: {
          summary: `完成 ${durationValue}${durationUnit} 的训练，已沉淀本次收获与下一步动作。`,
          completedContent: mockOrganizedRecord.completed_content,
          issues: mockOrganizedRecord.problems,
          nextActions: mockOrganizedRecord.next_suggestions
        }
      });
      const savedInStorage = getLocalRecordsByPlanId(planId).some((item) => item.id === savedRecord.id);

      if (!savedInStorage) {
        throw new Error("Local storage write verification failed");
      }

      setSaveError("");
      setSaved(true);
      setTimeout(() => {
        const nextPath = `/plans/${planId}?saved=1`;
        router.push(nextPath);
        window.setTimeout(() => {
          if (window.location.pathname !== `/plans/${planId}`) {
            window.location.assign(nextPath);
          }
        }, 700);
      }, 600);
    } catch {
      setSaved(false);
      setSaveError("保存失败：浏览器本地存储不可用或写入失败，请检查无痕模式/隐私设置后重试。");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">为计划新增记录</CardTitle>
          <Tag className="border-moss-200 bg-moss-50 text-moss-700">{planTitle}</Tag>
        </div>

        <TextArea
          value={rawInput}
          onChange={(event) => setRawInput(event.target.value)}
          placeholder="输入本次训练/学习后的杂乱记录，AI 会整理为：本次完成内容、暴露问题、下一步建议。"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-ink-900/85">
            <span className="block font-medium">本次时长/次数</span>
            <input
              type="number"
              min={1}
              value={durationValue}
              onChange={(event) => setDurationValue(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-moss-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
            />
          </label>

          <label className="space-y-2 text-sm text-ink-900/85">
            <span className="block font-medium">记录单位</span>
            <select
              value={durationUnit}
              onChange={(event) =>
                setDurationUnit(event.target.value as (typeof recordUnits)[number])
              }
              className="h-11 w-full rounded-xl border border-moss-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
            >
              {recordUnits.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onOrganize}>
            AI 整理本次记录
          </Button>
          <Link href={`/plans/${planId}`} className={buttonClasses("ghost", "md")}>
            返回计划详情
          </Link>
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle className="text-xl">AI 整理结果（Mock）</CardTitle>

        {generated ? (
          <div className="space-y-4 text-sm leading-7 text-ink-900/85">
            <div>
              <p className="font-medium">本次完成内容</p>
              <CardText>{mockOrganizedRecord.completed_content}</CardText>
            </div>
            <div>
              <p className="font-medium">暴露问题</p>
              <ul className="list-disc space-y-1 pl-5">
                {mockOrganizedRecord.problems.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">下一步建议</p>
              <ul className="list-disc space-y-1 pl-5">
                {mockOrganizedRecord.next_suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-moss-200 bg-moss-50/70 p-3 text-sm">
              本次记录：{durationValue}
              {durationUnit}
            </div>

            <Button type="button" onClick={onSave}>
              保存记录
            </Button>
          </div>
        ) : (
          <CardText>点击“AI 整理本次记录”后，这里会展示结构化结果。</CardText>
        )}

        {saved ? <p className="text-sm text-moss-700">已保存，正在返回计划详情...</p> : null}
        {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
      </Card>
    </div>
  );
}
