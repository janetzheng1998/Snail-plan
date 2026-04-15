type OrganizedRecord = {
  summary: string;
  completedContent: string;
  issues: string[];
  nextActions: string[];
};

type WorkersAiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
};

type Env = {
  AI?: WorkersAiBinding;
  CLOUDFLARE_AI_ORGANIZE_MODEL?: string;
};

type Context = {
  env: Env;
  request: Request;
};

const ORGANIZE_PROVIDER = "workers-ai";
const ORGANIZE_API_VERSION = "2026-04-15";

function withDefaultHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Organize-Provider": ORGANIZE_PROVIDER,
    "X-Organize-Version": ORGANIZE_API_VERSION
  });

  if (extra) {
    const incoming = new Headers(extra);
    incoming.forEach((value, key) => headers.set(key, value));
  }

  return headers;
}

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: withDefaultHeaders(headers)
  });
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeOrganized(value: unknown): OrganizedRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const summary = typeof source.summary === "string" ? source.summary.trim() : "";
  const completedContent =
    typeof source.completedContent === "string" ? source.completedContent.trim() : "";
  const issues = safeStringArray(source.issues);
  const nextActions = safeStringArray(source.nextActions);

  if (!summary && !completedContent) {
    return null;
  }

  return {
    summary: summary || completedContent,
    completedContent: completedContent || summary,
    issues,
    nextActions
  };
}

function normalizePlainText(value: string): string {
  return value
    .replace(/\s+/g, "")
    .replace(/[，。！？；、“”‘’：,.!?;:'"()\[\]{}<>《》]/g, "")
    .trim();
}

function similarityByContainment(a: string, b: string): number {
  const na = normalizePlainText(a);
  const nb = normalizePlainText(b);
  if (!na || !nb) {
    return 0;
  }

  if (na.includes(nb) || nb.includes(na)) {
    return Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  }

  let hit = 0;
  for (const char of na) {
    if (nb.includes(char)) {
      hit += 1;
    }
  }
  return hit / Math.max(na.length, nb.length);
}

function buildHeuristicFallback(text: string): OrganizedRecord {
  const lines = text
    .split(/\n+/)
    .flatMap((line) => line.split(/[。！？!?]/))
    .map((item) => item.trim())
    .filter(Boolean);

  const main = lines.slice(0, 2).join("，");
  const issueCandidates = lines.filter((line) =>
    /(问题|不够|不稳|困难|卡|不会|紧张|错误|不足|分心|头声|牙关|气息)/.test(line)
  );
  const issues = issueCandidates.slice(0, 3);

  const nextActions =
    issues.length > 0
      ? issues.map((issue) => `针对“${issue.slice(0, 18)}”做 10 分钟分解练习`).slice(0, 3)
      : ["拆成 2 个小目标分段练习", "每段录音回听 1 次并标注问题", "下次先热身再进入核心训练"];

  return {
    summary: main ? `本次聚焦练习并定位了关键问题：${main.slice(0, 28)}` : "本次完成了阶段训练并形成复盘",
    completedContent: main || text.slice(0, 80),
    issues,
    nextActions
  };
}

function needsRewrite(result: OrganizedRecord, rawText: string): boolean {
  const summaryTooShort = normalizePlainText(result.summary).length < 8;
  const completedTooSimilar = similarityByContainment(result.completedContent, rawText) > 0.86;
  const summaryTooSimilar = similarityByContainment(result.summary, rawText) > 0.75;
  const tooFewActions = result.nextActions.length === 0;
  return summaryTooShort || completedTooSimilar || summaryTooSimilar || tooFewActions;
}

function parseJsonFromText(content: string): unknown {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    if (!fenced) {
      return null;
    }

    try {
      return JSON.parse(fenced);
    } catch {
      return null;
    }
  }
}

function readNested(value: unknown, path: Array<string | number>): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (typeof key === "number") {
      if (!Array.isArray(current) || current.length <= key) {
        return undefined;
      }
      current = current[key];
      continue;
    }

    if (!current || typeof current !== "object" || !(key in (current as Record<string, unknown>))) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function tryNormalizeFromAny(value: unknown): OrganizedRecord | null {
  const direct = normalizeOrganized(value);
  if (direct) {
    return direct;
  }

  if (typeof value === "string") {
    const parsed = parseJsonFromText(value);
    return normalizeOrganized(parsed);
  }

  return null;
}

function resolveOrganizedFromAiResult(aiResult: unknown): OrganizedRecord | null {
  const candidates: unknown[] = [
    aiResult,
    readNested(aiResult, ["response"]),
    readNested(aiResult, ["result"]),
    readNested(aiResult, ["result", "response"]),
    readNested(aiResult, ["output"]),
    readNested(aiResult, ["output_text"]),
    readNested(aiResult, ["choices", 0, "message", "content"]),
    readNested(aiResult, ["choices", 0, "text"])
  ];

  for (const candidate of candidates) {
    const normalized = tryNormalizeFromAny(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function compactDetail(value: unknown): string {
  if (typeof value === "string") {
    return value.slice(0, 600);
  }

  try {
    return JSON.stringify(value).slice(0, 600);
  } catch {
    return String(value).slice(0, 600);
  }
}

export async function onRequestPost(context: Context): Promise<Response> {
  const aiBinding = context.env.AI;
  if (!aiBinding || typeof aiBinding.run !== "function") {
    return json({ error: "Missing Workers AI binding: AI" }, 500);
  }

  const model =
    context.env.CLOUDFLARE_AI_ORGANIZE_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast";

  const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const planTitle = typeof body?.planTitle === "string" ? body.planTitle.trim() : "";
  const durationValue =
    typeof body?.durationValue === "number" && Number.isFinite(body.durationValue)
      ? body.durationValue
      : null;
  const durationUnit = typeof body?.durationUnit === "string" ? body.durationUnit.trim() : "";

  if (!text) {
    return json({ error: "text is required" }, 400);
  }

  const userPrompt = [
    "请把下面成长记录整理为 JSON，不要输出 JSON 以外的文字。",
    '字段要求：{"summary":string,"completedContent":string,"issues":string[],"nextActions":string[]}',
    "要求：summary 一句话（15-35字）；completedContent 1-2句；issues 1-3条；nextActions 2-3条。",
    "重要：不要照抄原文；请先概括再表达，语言简洁、可执行。",
    planTitle ? `计划名称：${planTitle}` : "计划名称：未提供",
    durationValue ? `本次时长/次数：${durationValue}${durationUnit}` : "本次时长/次数：未提供",
    `原始记录：${text}`
  ]
    .filter(Boolean)
    .join("\n");

  let aiResult: unknown;
  try {
    aiResult = await aiBinding.run(model, {
      messages: [
        {
          role: "system",
          content:
            "你是成长记录整理助手。输出必须是 JSON，且字段严格为 summary、completedContent、issues、nextActions。"
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            completedContent: { type: "string" },
            issues: { type: "array", items: { type: "string" } },
            nextActions: { type: "array", items: { type: "string" } }
          },
          required: ["summary", "completedContent", "issues", "nextActions"]
        }
      }
    });
  } catch (error) {
    try {
      aiResult = await aiBinding.run(model, {
        messages: [
          {
            role: "system",
            content:
              "你是成长记录整理助手。输出必须是 JSON，字段为 summary、completedContent、issues、nextActions。"
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      });
    } catch (fallbackError) {
      return json(
        {
          error: "Workers AI request failed",
          detail:
            fallbackError instanceof Error
              ? fallbackError.message
              : error instanceof Error
                ? error.message
                : "unknown error"
        },
        502
      );
    }
  }

  const normalized = resolveOrganizedFromAiResult(aiResult);
  if (!normalized) {
    return json(buildHeuristicFallback(text));
  }

  if (needsRewrite(normalized, text)) {
    const rewritePrompt = [
      "请对以下结果进行二次改写，目标是更有复盘价值，禁止照抄原文。",
      "只输出 JSON，字段必须为 summary/completedContent/issues/nextActions。",
      `原始记录：${text}`,
      `当前结果：${JSON.stringify(normalized)}`
    ].join("\n");

    try {
      const retryResult = await aiBinding.run(model, {
        messages: [
          {
            role: "system",
            content:
              "你是复盘教练。请将内容改写成更可执行、更有信息增量的复盘，不要机械复述。"
          },
          {
            role: "user",
            content: rewritePrompt
          }
        ],
        temperature: 0.35,
        max_tokens: 500
      });

      const rewritten = resolveOrganizedFromAiResult(retryResult);
      if (rewritten && !needsRewrite(rewritten, text)) {
        return json(rewritten);
      }
    } catch {
      // fall through
    }

    return json({
      ...buildHeuristicFallback(text),
      issues: normalized.issues.length > 0 ? normalized.issues : buildHeuristicFallback(text).issues,
      nextActions:
        normalized.nextActions.length > 0 ? normalized.nextActions : buildHeuristicFallback(text).nextActions
    });
  }

  return json(normalized);
}

export async function onRequestGet(): Promise<Response> {
  return json(
    {
      ok: true,
      provider: ORGANIZE_PROVIDER,
      version: ORGANIZE_API_VERSION,
      message: "Use POST /api/organize to organize text."
    },
    200
  );
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: withDefaultHeaders()
  });
}
