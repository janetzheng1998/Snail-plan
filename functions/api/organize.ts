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
    "要求：summary 一句话；completedContent 1-2句；issues 0-3条；nextActions 1-3条。",
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
    return json(
      {
        error: "Workers AI response format invalid",
        detail: compactDetail(aiResult)
      },
      502
    );
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
