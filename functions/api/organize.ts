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
const ORGANIZE_API_VERSION = "2026-04-27-v1";

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
  const inferredIssues = [
    /(头声|高音|音准|换声)/.test(text) ? "发声控制稳定性不足，关键声区衔接不够稳定" : "",
    /(牙关|口腔|咬字|共鸣)/.test(text) ? "发声通道打开度不足，影响共鸣效率与音色统一" : "",
    /(气息|呼吸)/.test(text) ? "气息支撑连续性不足，导致输出稳定性波动" : "",
    /(分心|状态慢|拖延)/.test(text) ? "进入专注状态偏慢，训练有效时段占比偏低" : ""
  ].filter(Boolean);
  const issues = [...issueCandidates, ...inferredIssues]
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  const nextActions =
    issues.length > 0
      ? issues.map((issue) => `围绕“${issue.slice(0, 20)}”做 10 分钟分解练习并录音对比`).slice(0, 4)
      : [
          "把本次内容拆成 2 个可量化小目标，分别练习 12 分钟",
          "每段练习后做 1 次录音回听，记录 1 个最明显问题",
          "下次训练开始前先做 5 分钟针对性热身再进入主练"
        ];

  return {
    summary: main
      ? `本次训练完成了核心内容推进，并明确了影响稳定性的关键问题：${main.slice(0, 26)}`
      : "本次训练完成了阶段推进，并形成了可执行的复盘方向",
    completedContent: main || text.slice(0, 80),
    issues: issues.length >= 2 ? issues : ["训练过程中的关键动作稳定性不足", "问题定位到改进动作之间的闭环不够完整"],
    nextActions: nextActions.length >= 2 ? nextActions : ["将关键动作拆分成 2 段各练 10 分钟", "每段结束后立即复盘并记录下一步调整"]
  };
}

function hasDurationHint(text: string): boolean {
  return /\d+\s*(分钟|次|组|轮|遍)/.test(text);
}

function hasCheckHint(text: string): boolean {
  return /(记录|回听|检查|确认|误差|稳定|不少于|至少|≤|>=|达成|完成|对比)/.test(text);
}

function isGenericAction(text: string): boolean {
  return /(继续练习|提高|加强|注意|保持|巩固|准备|多练|再练|进一步)/.test(text) && !hasDurationHint(text);
}

function actionTemplateFromIssue(issue: string): string {
  if (/(头声|高音|换声|音准)/.test(issue)) {
    return "做 12 分钟头声稳定练习（每组 6 次，共 4 组），结束后回听录音并标记 1 处最不稳定音。";
  }
  if (/(牙关|口腔|咬字|共鸣)/.test(issue)) {
    return "做 10 分钟口腔打开与咬字分解练习（2 轮），每轮结束录音并检查咬字清晰度是否提升。";
  }
  if (/(气息|呼吸|支撑)/.test(issue)) {
    return "做 8 分钟气息支撑训练（4 轮呼吸+发声），每轮后记录一次是否出现气息断点。";
  }
  if (/(分心|状态慢|拖延|专注)/.test(issue)) {
    return "先做 5 分钟专注热身再进入主练，主练分 2 段各 12 分钟，段末写 1 条当段问题。";
  }
  return `围绕“${issue.slice(0, 18)}”做 10 分钟分解练习（2 轮），每轮结束后记录 1 条改进点。`;
}

function toExecutableAction(action: string, issueHint?: string): string {
  const trimmed = action.trim();
  if (!trimmed) {
    return issueHint ? actionTemplateFromIssue(issueHint) : "做 10 分钟分解练习（2 轮），结束后记录 1 条改进点。";
  }

  if (isGenericAction(trimmed) || (!hasDurationHint(trimmed) && !hasCheckHint(trimmed))) {
    return issueHint ? actionTemplateFromIssue(issueHint) : `${trimmed}（10 分钟），结束后回听录音并记录 1 条改进点。`;
  }

  if (!hasDurationHint(trimmed) && hasCheckHint(trimmed)) {
    return `${trimmed}（10 分钟）`;
  }

  if (hasDurationHint(trimmed) && !hasCheckHint(trimmed)) {
    return `${trimmed}，结束后回听录音并记录 1 条改进点。`;
  }

  return trimmed;
}

function needsRewrite(result: OrganizedRecord, rawText: string): boolean {
  const summaryTooShort = normalizePlainText(result.summary).length < 8;
  const completedTooSimilar = similarityByContainment(result.completedContent, rawText) > 0.86;
  const summaryTooSimilar = similarityByContainment(result.summary, rawText) > 0.75;
  const tooFewActions = result.nextActions.length < 2;
  const tooFewIssues = result.issues.length < 2;
  const hasGenericActions = result.nextActions.some((item) => isGenericAction(item));
  return (
    summaryTooShort ||
    completedTooSimilar ||
    summaryTooSimilar ||
    tooFewActions ||
    tooFewIssues ||
    hasGenericActions
  );
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

function enforceQualityFloor(result: OrganizedRecord, rawText: string): OrganizedRecord {
  const fallback = buildHeuristicFallback(rawText);
  const uniqueIssues = [...new Set(result.issues.map((item) => item.trim()).filter(Boolean))];
  const uniqueActions = [...new Set(result.nextActions.map((item) => item.trim()).filter(Boolean))];
  const mergedIssues =
    (uniqueIssues.length >= 2 ? uniqueIssues : [...uniqueIssues, ...fallback.issues]).slice(0, 4);

  const mergedActions = (uniqueActions.length >= 2 ? uniqueActions : [...uniqueActions, ...fallback.nextActions])
    .map((action, index) => toExecutableAction(action, mergedIssues[index % Math.max(mergedIssues.length, 1)]))
    .filter(Boolean);

  const dedupedActions = [...new Set(mergedActions)].slice(0, 4);

  return {
    summary: result.summary.trim() || fallback.summary,
    completedContent: result.completedContent.trim() || fallback.completedContent,
    issues: mergedIssues,
    nextActions:
      dedupedActions.length >= 2
        ? dedupedActions
        : [...dedupedActions, ...fallback.nextActions.map((item, index) => toExecutableAction(item, mergedIssues[index % Math.max(mergedIssues.length, 1)]))].slice(0, 4)
  };
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
  const sessionLabel = typeof body?.sessionLabel === "string" ? body.sessionLabel.trim() : "";

  if (!text) {
    return json({ error: "text is required" }, 400);
  }

  const userPrompt = [
    "# 角色设定",
    "你是一位跨领域专业教练，能从学员日常记录中提取关键行为、诊断问题链，并给出可执行处方。",
    "",
    "# 任务流程（先内部思考，再输出）",
    "请在内部严格执行以下步骤：",
    "1) 领域识别：从“健身/运动、音乐/声乐、编程/技术、学习/考试、写作/创作、语言学习、艺术/设计、工作/项目、其他”中判断主领域（可多选，按置信度排序）。",
    "2) 专家角色切换：根据主领域切换到对应教练视角进行分析。",
    "3) 分析框架：信息结构化提取 + 四层深度诊断（行为/技术/认知/策略）+ 因果链 + 阶段定位 + SMART处方。",
    "4) 反抄写规则：避免照抄原文句式，不要连续复用用户措辞。",
    "",
    "# 输出格式（必须严格遵守）",
    "你最终只能输出 JSON，且字段必须严格为：summary、completedContent、issues、nextActions。",
    'JSON 结构：{"summary":string,"completedContent":string,"issues":string[],"nextActions":string[]}',
    "",
    "# 字段映射规则",
    "1) summary：一句“教练视角”核心判断（15-40字），要有总结感，不是原话缩写。",
    "2) completedContent：2-4句，包含“做了什么、识别了什么、推进了什么”，必要时简要提及阶段定位。",
    "3) issues：2-4条，使用更抽象/专业表达，描述真正瓶颈而非表层复述。",
    "4) nextActions：2-4条，每条必须包含“动作 + 时长/次数 + 验收方式（如何判断有效）”。",
    "5) 当信息不足时，允许基于上下文做谨慎推断，但要避免编造具体事实。",
    "6) 若结果与原文过于相似，请自动重写为“提炼后的复盘语言”。",
    "",
    "# 语气与风格",
    "专业但亲切，有教练感；简洁、有条理；避免空话。",
    "",
    "# 本次记录上下文",
    planTitle ? `计划名称：${planTitle}` : "计划名称：未提供",
    sessionLabel ? `进度定位：${sessionLabel}` : "进度定位：未提供",
    durationValue ? `本次时长/次数：${durationValue}${durationUnit}` : "本次时长/次数：未提供",
    `学员原始记录：${text}`
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
            "你是跨领域个人成长教练。请先进行领域识别与深度诊断，再输出高质量复盘结果。禁止照抄原文。输出必须是 JSON，字段严格为 summary、completedContent、issues、nextActions。"
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
            issues: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
            nextActions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 }
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
              "你是跨领域成长教练。输出必须是 JSON，字段为 summary、completedContent、issues、nextActions。不要照抄原文。"
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

  const normalizedWithFloor = enforceQualityFloor(normalized, text);
  if (needsRewrite(normalizedWithFloor, text)) {
    const rewritePrompt = [
      "请对以下结果进行二次改写，目标是更有复盘价值，禁止照抄原文。",
      "只输出 JSON，字段必须为 summary/completedContent/issues/nextActions。",
      "issues 必须 2-4 条，nextActions 必须 2-4 条，且每条都要满足“动作 + 时长/次数 + 检查标准”。",
      `原始记录：${text}`,
      `当前结果：${JSON.stringify(normalizedWithFloor)}`
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
      if (rewritten) {
        const rewrittenWithFloor = enforceQualityFloor(rewritten, text);
        if (!needsRewrite(rewrittenWithFloor, text)) {
          return json(rewrittenWithFloor);
        }
      }
    } catch {
      // fall through
    }

    return json(enforceQualityFloor(buildHeuristicFallback(text), text));
  }

  return json(normalizedWithFloor);
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
