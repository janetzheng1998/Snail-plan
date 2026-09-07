type OrganizedRecord = {
  summary: string;
  cleanedRawText: string;
  completedContent: string;
  keyFindings: string[];
  currentBlocks: string[];
  possibleReasons: string[];
  issues: string[];
  nextActions: string[];
  recordReminders: string[];
};

type Env = {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  ORGANIZE_API_ALLOWED_ORIGIN?: string;
};

type Context = {
  env: Env;
  request: Request;
};

type DeepSeekMessage = {
  role: "system" | "user";
  content: string;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";
const ORGANIZE_PROVIDER = "deepseek";
const ORGANIZE_API_VERSION = "2026-09-08-v1";
const MAX_RECORD_TEXT_LENGTH = 1600;

function withDefaultHeaders(env?: Env, extra?: HeadersInit): Headers {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": env?.ORGANIZE_API_ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Organize-Provider": ORGANIZE_PROVIDER,
    "X-Organize-Version": ORGANIZE_API_VERSION
  });

  if (extra) {
    const incoming = new Headers(extra);
    incoming.forEach((value, key) => headers.set(key, value));
  }

  return headers;
}

function json(data: unknown, status = 200, env?: Env, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: withDefaultHeaders(env, headers)
  });
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 5);
}

function cleanRawText(text: string): string {
  const fillerPattern = /(然后呢|然后|就是|那个|嗯+|呃+|啊+|额+|吧|嘛)(，|。|\s)*/g;
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(fillerPattern, "")
    .replace(/([，。！？；：])\1+/g, "$1")
    .replace(/\s*([，。！？；：])\s*/g, "$1")
    .trim();

  if (!cleaned) {
    return text.trim();
  }

  return /[。！？]$/.test(cleaned) ? cleaned : `${cleaned}。`;
}

function normalizeOrganized(value: unknown): OrganizedRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const summary = readText(source.summary);
  const cleanedRawText = readText(source.cleanedRawText);
  const completedContent = readText(source.completedContent);
  const keyFindings = safeStringArray(source.keyFindings);
  const currentBlocks = safeStringArray(source.currentBlocks);
  const possibleReasons = safeStringArray(source.possibleReasons);
  const issues = safeStringArray(source.issues);
  const nextActions = safeStringArray(source.nextActions);
  const recordReminders = safeStringArray(source.recordReminders);

  if (!summary && !completedContent) {
    return null;
  }

  return {
    summary: summary || completedContent,
    cleanedRawText,
    completedContent: completedContent || summary,
    keyFindings,
    currentBlocks: currentBlocks.length > 0 ? currentBlocks : issues,
    possibleReasons,
    issues:
      currentBlocks.length > 0
        ? currentBlocks
        : issues.length > 0
          ? issues
          : ["本次记录里还没有明确写出阻碍点，下次可以补充最卡住的一步。"],
    nextActions:
      nextActions.length > 0
        ? nextActions
        : ["下次开始前先设定一个小目标，结束后立刻写下完成情况和下一步。"],
    recordReminders:
      recordReminders.length > 0
        ? recordReminders
        : ["记录本次动作或任务的具体数量。", "补充最明显的卡点和当时的身体/情绪状态。"]
  };
}

function parseJsonFromModel(content: string): unknown {
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

function buildPrompt({
  text,
  planTitle,
  sessionLabel,
  durationValue,
  durationUnit
}: {
  text: string;
  planTitle: string;
  sessionLabel: string;
  durationValue: number | null;
  durationUnit: string;
}): DeepSeekMessage[] {
  const context = [
    planTitle ? `计划名称：${planTitle}` : "计划名称：未提供",
    sessionLabel ? `进度定位：${sessionLabel}` : "进度定位：未提供",
    durationValue ? `本次时长/次数：${durationValue}${durationUnit}` : "本次时长/次数：未提供",
    `用户原始记录：${text}`
  ].join("\n");

  return [
    {
      role: "system",
      content:
        "你是“蜗牛计划”的陪伴式复盘教练。你的任务不是改写用户原文，而是帮助用户从记录中看见进展、问题和下一步。你必须只输出 JSON。"
    },
    {
      role: "user",
      content: [
        "请根据用户的计划类型和本次记录输出严格 JSON，不要输出 Markdown，不要解释。",
        "",
        "字段必须为：",
        "cleanedRawText: 清理后的原始记录。自动去掉多余语气词或重复词，例如“然后呢”“就是”“嗯”“呃”，并补全基础标点。不得改变事实。",
        "summary: 一句话复盘，总结这次记录的核心意义，25-55字。",
        "completedContent: 本次进展，提炼今天实际完成了什么，以及它对目标的推进，1-3句。",
        "keyFindings: 关键发现，指出状态、能力变化、问题或模式，1-4条。",
        "currentBlocks: 当前卡点，判断最需要关注的 1-2 个阻碍。",
        "possibleReasons: 可能原因，基于记录做合理推测；信息不足时直接说缺少哪些信息，1-3条。",
        "nextActions: 下一步建议，1-3 个非常具体的小行动，必须能在下一次行动中执行。",
        "recordReminders: 下次记录提醒，提出 2-3 个下次应该观察或补充的信息。",
        "",
        "要求：",
        "不要只是换一种说法复述用户内容。",
        "不要给空泛建议，比如“继续努力”“注意调整”。",
        "如果信息不足，要直接指出缺少哪些信息。",
        "语气温和、具体、像一个陪伴式教练。",
        "",
        "JSON 示例：",
        '{"cleanedRawText":"今天完成了 60 分钟训练，做了推胸 3 组和史密斯 3 组，但胸部发力感不明显，不确定是否练到位。","summary":"这次记录说明你已经开始稳定执行训练，但更需要建立动作感受和效果判断。","completedContent":"完成 60 分钟胸背训练，并记录了推胸和史密斯训练量。对目标的推进在于完成了基础训练量，同时暴露出动作反馈不清晰的问题。","keyFindings":["训练量已经开始稳定记录","你开始关注是否真正练到目标肌群"],"currentBlocks":["胸部发力感不明显","缺少判断动作是否到位的观察标准"],"possibleReasons":["可能是肩胛控制、握距或动作轨迹影响了胸部参与感","记录里缺少重量、组间休息和动作视频反馈，因此无法进一步判断具体原因"],"nextActions":["下次推胸前先做 2 组空杆或轻重量热身，每组后确认胸部拉伸和收缩感","正式组每组结束后用 1-5 分记录胸部发力感"],"recordReminders":["记录每个动作的重量和组间休息","补充哪一组最有发力感、哪一组最不明显","如果可以，记录是否有肩膀代偿或手臂先疲劳"]}',
        "",
        context
      ].join("\n")
    }
  ];
}

export async function onRequestPost(context: Context): Promise<Response> {
  const apiKey = context.env.DEEPSEEK_API_KEY;
  const model = context.env.DEEPSEEK_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return json({ error: "还没有配置 DeepSeek API Key。" }, 503, context.env);
  }

  const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null;
  const text = readText(body?.text);
  const planTitle = readText(body?.planTitle);
  const sessionLabel = readText(body?.sessionLabel);
  const durationValue = readPositiveNumber(body?.durationValue);
  const durationUnit = readText(body?.durationUnit);

  if (!text) {
    return json({ error: "请输入本次记录内容。" }, 400, context.env);
  }

  if (text.length > MAX_RECORD_TEXT_LENGTH) {
    return json({ error: `本次记录太长了，请先控制在 ${MAX_RECORD_TEXT_LENGTH} 字以内。` }, 400, context.env);
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: buildPrompt({
        text,
        planTitle,
        sessionLabel,
        durationValue,
        durationUnit
      }),
      temperature: 0.25,
      max_tokens: 1000,
      response_format: {
        type: "json_object"
      }
    })
  });

  const payload = (await response.json().catch(() => null)) as DeepSeekResponse | null;

  if (!response.ok) {
    return json(
      {
        error: payload?.error?.message || "DeepSeek API 请求失败，请稍后重试。"
      },
      response.status,
      context.env
    );
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    return json({ error: "AI 没有返回可用内容，请重试。" }, 502, context.env);
  }

  const organized = normalizeOrganized(parseJsonFromModel(content));
  if (!organized) {
    return json({ error: "AI 返回格式异常，请重试。" }, 502, context.env);
  }

  if (!organized.cleanedRawText) {
    organized.cleanedRawText = cleanRawText(text);
  }

  return json({ organized }, 200, context.env);
}

export async function onRequestGet(context: Context): Promise<Response> {
  return json(
    {
      ok: true,
      provider: ORGANIZE_PROVIDER,
      version: ORGANIZE_API_VERSION,
      model: context.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
      configured: Boolean(context.env.DEEPSEEK_API_KEY),
      message: "Use POST /api/organize to organize text."
    },
    200,
    context.env
  );
}

export async function onRequestOptions(context: Context): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: withDefaultHeaders(context.env)
  });
}
