"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { TextArea } from "@/components/ui/text-area";
import {
  getLocalRecordsByPlanId,
  saveLocalRecord,
  type LocalOrganizedRecord
} from "@/lib/local-records";
import { recordUnits } from "@/lib/mock-data";

type AddRecordFormProps = {
  planId: string;
  planTitle: string;
  planDetailPath?: string;
};

const sessionUnits = ["节", "次", "天"] as const;
type SessionUnit = (typeof sessionUnits)[number];

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type BrowserSpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal?: boolean;
    length: number;
    [index: number]: {
      transcript?: string;
    };
  }>;
};

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

function buildLocalPreview(
  rawText: string,
  durationValue: number,
  durationUnit: (typeof recordUnits)[number],
  sessionLabel?: string
): LocalOrganizedRecord {
  const sentences = rawText
    .replace(/\s+/g, " ")
    .split(/[。！？!?]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const shortText = rawText.length > 44 ? `${rawText.slice(0, 44)}...` : rawText;
  const issueSentence = sentences.find((item) => /(慢|卡|分心|问题|不足|紧张|疲劳|不稳)/.test(item));
  const sessionPrefix = sessionLabel ? `${sessionLabel}，` : "";

  return {
    summary: `${sessionPrefix}完成 ${durationValue}${durationUnit} 的记录，核心片段：${shortText}`,
    completedContent: `${sessionPrefix}完成 ${durationValue}${durationUnit} 的训练/学习，重点记录：${shortText}`,
    issues: issueSentence
      ? [issueSentence]
      : ["本次记录未明确提到阻碍点，建议下次补充“最卡的一步”。"],
    nextActions: [
      `下次开始前先设定本次唯一目标，预计投入 ${durationValue}${durationUnit}。`,
      issueSentence
        ? `围绕“${issueSentence.slice(0, 16)}”做一次 10 分钟分解练习。`
        : "结束后立刻写下 3 行复盘：完成了什么、卡在哪里、下一步做什么。"
    ]
  };
}

function parsePositiveInteger(input: string): number | undefined {
  if (!input.trim()) {
    return undefined;
  }

  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.floor(parsed);
}

function formatSessionLabel(sessionIndexInput: string, sessionUnit: SessionUnit): string {
  const sessionIndex = parsePositiveInteger(sessionIndexInput);
  return sessionIndex ? `第${sessionIndex}${sessionUnit}` : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeOrganizedResult(
  payload: unknown,
  fallback: LocalOrganizedRecord
): LocalOrganizedRecord | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source =
    "organized" in payload && payload.organized && typeof payload.organized === "object"
      ? (payload.organized as Record<string, unknown>)
      : (payload as Record<string, unknown>);

  const summary = typeof source.summary === "string" ? source.summary.trim() : "";
  const completedContent =
    typeof source.completedContent === "string" ? source.completedContent.trim() : "";
  const issues = readStringArray(source.issues);
  const nextActions = readStringArray(source.nextActions);

  if (!summary && !completedContent) {
    return null;
  }

  return {
    summary: summary || completedContent,
    completedContent: completedContent || summary,
    issues: issues.length > 0 ? issues : fallback.issues,
    nextActions: nextActions.length > 0 ? nextActions : fallback.nextActions
  };
}

export function AddRecordForm({ planId, planTitle, planDetailPath }: AddRecordFormProps) {
  const router = useRouter();
  const resolvedPlanDetailPath = planDetailPath ?? `/plans/${planId}`;
  const [rawInput, setRawInput] = useState("");
  const [durationValue, setDurationValue] = useState(60);
  const [durationUnit, setDurationUnit] = useState<(typeof recordUnits)[number]>("分钟");
  const [sessionIndexInput, setSessionIndexInput] = useState("1");
  const [sessionUnit, setSessionUnit] = useState<SessionUnit>("次");
  const [organizedPreview, setOrganizedPreview] = useState<LocalOrganizedRecord | null>(null);
  const [generated, setGenerated] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [organizeError, setOrganizeError] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [speechStatus, setSpeechStatus] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const fallbackRawText =
    "今天训练了 60 分钟，前半段进入状态慢，中段有分心，但后面通过分解练习把核心问题找出来了。";

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
    };
  }, []);

  const appendTranscript = (transcript: string) => {
    const cleaned = transcript.trim();
    if (!cleaned) {
      return;
    }

    setRawInput((current) => {
      if (!current.trim()) {
        return cleaned;
      }

      const suffix = current.endsWith("\n") ? "" : "\n";
      return `${current}${suffix}${cleaned}`;
    });
  };

  const getRecognitionErrorMessage = (errorCode: string) => {
    if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
      return "语音识别权限被拒绝，请在浏览器地址栏允许麦克风权限后重试。";
    }

    if (errorCode === "audio-capture") {
      return "未检测到麦克风设备，请检查系统麦克风设置。";
    }

    if (errorCode === "no-speech") {
      return "没有识别到语音，请靠近麦克风后重试。";
    }

    if (errorCode === "network") {
      return "语音识别网络异常，请稍后重试。";
    }

    return "语音识别失败，请重试。";
  };

  const getRecognitionConstructor = (): BrowserSpeechRecognitionConstructor | null => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  };

  const ensureRecognition = (): BrowserSpeechRecognition | null => {
    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const RecognitionConstructor = getRecognitionConstructor();
    if (!RecognitionConstructor) {
      return null;
    }

    const instance = new RecognitionConstructor();
    instance.lang = "zh-CN";
    instance.continuous = true;
    instance.interimResults = false;
    instance.onstart = () => {
      setRecognizing(true);
      setSpeechStatus("正在录音/识别中...");
      setSpeechError("");
      setInterimTranscript("");
    };
    instance.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const candidate = result?.[0]?.transcript?.trim() ?? "";
        if (result?.isFinal && candidate) {
          finalText += candidate;
        } else if (candidate) {
          interimText += candidate;
        }
      }

      setInterimTranscript(interimText);
      appendTranscript(finalText);
    };
    instance.onerror = (event) => {
      setSpeechError(getRecognitionErrorMessage(event.error ?? ""));
      setSpeechStatus("");
      setInterimTranscript("");
      setRecognizing(false);
    };
    instance.onend = () => {
      setSpeechStatus("");
      setInterimTranscript("");
      setRecognizing(false);
    };
    recognitionRef.current = instance;
    return instance;
  };

  const toggleSpeechRecognition = () => {
    const recognition = ensureRecognition();
    if (!recognition) {
      setSpeechStatus("");
      setInterimTranscript("");
      setRecognizing(false);
      setSpeechError("当前浏览器不支持语音识别，请使用最新版 Chrome 或 Edge。");
      return;
    }

    if (recognizing) {
      recognition.stop();
      setSpeechStatus("正在停止识别...");
      return;
    }

    setSpeechError("");
    try {
      recognition.start();
    } catch {
      setSpeechStatus("");
      setInterimTranscript("");
      setRecognizing(false);
      setSpeechError("语音识别启动失败，请稍后重试。");
    }
  };

  const onOrganize = async () => {
    const normalizedRawInput = rawInput.trim() || fallbackRawText;
    const sessionLabel = formatSessionLabel(sessionIndexInput, sessionUnit);
    const localFallback = buildLocalPreview(
      normalizedRawInput,
      durationValue,
      durationUnit,
      sessionLabel || undefined
    );

    if (!rawInput.trim()) {
      setRawInput(fallbackRawText);
    }

    setOrganizing(true);
    setOrganizeError("");
    setSaved(false);

    try {
      const response = await fetch("/api/organize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: normalizedRawInput,
          planTitle,
          sessionLabel: sessionLabel || undefined,
          durationValue,
          durationUnit
        })
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const fallbackMessage =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "AI 整理暂时不可用，请稍后重试。";
        throw new Error(fallbackMessage);
      }

      const normalized = normalizeOrganizedResult(payload, localFallback);
      if (!normalized) {
        throw new Error("AI 返回格式异常，请重试。");
      }

      setOrganizedPreview(normalized);
      setGenerated(true);
    } catch (error) {
      setGenerated(true);
      setOrganizedPreview(localFallback);
      setOrganizeError(
        error instanceof Error
          ? `${error.message} 已先使用本地整理结果，你可以继续保存。`
          : "AI 整理失败，已先使用本地整理结果，你可以继续保存。"
      );
    } finally {
      setOrganizing(false);
    }
  };

  const onSave = () => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);

    const sessionIndex = parsePositiveInteger(sessionIndexInput);
    const sessionLabel = sessionIndex ? `第${sessionIndex}${sessionUnit}` : "";

    try {
      const savedRecord = saveLocalRecord({
        planId,
        date: localDate,
        rawText: rawInput.trim() || fallbackRawText,
        durationValue,
        durationUnit,
        sessionIndex,
        sessionUnit: sessionIndex ? sessionUnit : undefined,
        organized:
          organizedPreview ??
          buildLocalPreview(
            rawInput.trim() || fallbackRawText,
            durationValue,
            durationUnit,
            sessionLabel || undefined
          )
      });
      const savedInStorage = getLocalRecordsByPlanId(planId).some((item) => item.id === savedRecord.id);

      if (!savedInStorage) {
        throw new Error("Local storage write verification failed");
      }

      setSaveError("");
      setSaved(true);
      setTimeout(() => {
        const nextPath = `${resolvedPlanDetailPath}${resolvedPlanDetailPath.includes("?") ? "&" : "?"}saved=1`;
        router.push(nextPath);
        window.setTimeout(() => {
          const currentRelativePath = `${window.location.pathname}${window.location.search}`;
          if (currentRelativePath !== nextPath) {
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
        <CardTitle className="text-xl">{planTitle.trim() || "为计划新增记录"}</CardTitle>

        <div className="space-y-3">
          <div className="relative">
            <TextArea
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              placeholder="输入本次训练/学习后的杂乱记录，AI 会整理为：本次完成内容、暴露问题、下一步建议。"
              className="pb-12 pr-12"
            />
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              aria-label={recognizing ? "停止语音识别" : "开始语音识别"}
              title={recognizing ? "停止语音识别" : "开始语音识别"}
              className={[
                "absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300 focus-visible:ring-offset-1",
                recognizing ? "animate-pulse text-red-500" : "text-moss-700/85 hover:text-moss-800"
              ].join(" ")}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {speechStatus ? <p className="text-sm text-moss-700">{speechStatus}</p> : null}
          {recognizing && interimTranscript ? (
            <div className="rounded-xl border border-moss-200 bg-moss-50/70 px-3 py-2 text-sm text-ink-900/75">
              实时识别：{interimTranscript}
            </div>
          ) : null}
          {speechError ? <p className="text-sm text-red-600">{speechError}</p> : null}
        </div>

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

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <label className="space-y-2 text-sm text-ink-900/85">
            <span className="block font-medium">这是第几节/次/天</span>
            <input
              type="number"
              min={1}
              step={1}
              value={sessionIndexInput}
              onChange={(event) => setSessionIndexInput(event.target.value)}
              placeholder="例如 3"
              className="h-11 w-full rounded-xl border border-moss-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
            />
          </label>

          <label className="space-y-2 text-sm text-ink-900/85">
            <span className="block font-medium">序号单位</span>
            <select
              value={sessionUnit}
              onChange={(event) => setSessionUnit(event.target.value as SessionUnit)}
              className="h-11 w-full rounded-xl border border-moss-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300"
            >
              {sessionUnits.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onOrganize} disabled={organizing}>
              {organizing ? "AI 整理中..." : "AI 整理本次记录"}
            </Button>
            <Link href={resolvedPlanDetailPath} className={buttonClasses("ghost", "md")}>
              返回计划详情
            </Link>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle className="text-xl">AI 整理结果</CardTitle>

        {generated && organizedPreview ? (
          <div className="space-y-4 text-sm leading-7 text-ink-900/85">
            <div>
              <p className="font-medium">一句话概括</p>
              <CardText>{organizedPreview.summary}</CardText>
            </div>
            <div>
              <p className="font-medium">本次完成内容</p>
              <CardText>{organizedPreview.completedContent}</CardText>
            </div>
            <div>
              <p className="font-medium">暴露问题</p>
              <ul className="list-disc space-y-1 pl-5">
                {organizedPreview.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">下一步建议</p>
              <ul className="list-disc space-y-1 pl-5">
                {organizedPreview.nextActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-moss-200 bg-moss-50/70 p-3 text-sm">
              本次记录：
              {formatSessionLabel(sessionIndexInput, sessionUnit)
                ? `${formatSessionLabel(sessionIndexInput, sessionUnit)} · `
                : ""}
              {durationValue}
              {durationUnit}
            </div>

            <Button type="button" onClick={onSave}>
              保存记录
            </Button>
          </div>
        ) : (
          <CardText>点击“AI 整理本次记录”后，这里会展示结构化结果。</CardText>
        )}

        {organizeError ? <p className="text-sm text-amber-700">{organizeError}</p> : null}
        {saved ? <p className="text-sm text-moss-700">已保存，正在返回计划详情...</p> : null}
        {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
      </Card>
    </div>
  );
}
