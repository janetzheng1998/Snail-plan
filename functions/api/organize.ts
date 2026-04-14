type OrganizedRecord = {
  summary: string;
  completedContent: string;
  issues: string[];
  nextActions: string[];
};

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type Env = {
  OPENAI_API_KEY?: string;
  OPENAI_ORGANIZE_MODEL?: string;
  OPENAI_MODEL?: string;
};

type Context = {
  env: Env;
  request: Request;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
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

export async function onRequestPost(context: Context): Promise<Response> {
  const apiKey = context.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: "Missing OPENAI_API_KEY" }, 500);
  }

  const model = context.env.OPENAI_ORGANIZE_MODEL || context.env.OPENAI_MODEL || "gpt-4o-mini";

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
    planTitle ? `计划名称：${planTitle}` : "",
    durationValue ? `本次时长/次数：${durationValue}${durationUnit}` : "",
    "原始记录：",
    text
  ]
    .filter(Boolean)
    .join("\n");

  const completionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "你是成长记录整理助手。请把用户输入整理为简洁、可执行的结构化结果。保持客观，不要编造事实。"
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "organized_record",
          strict: true,
          schema: {
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
      }
    })
  });

  if (!completionResponse.ok) {
    const detail = await completionResponse.text();
    return json({ error: "AI service request failed", detail }, 502);
  }

  const completionData = (await completionResponse.json()) as OpenAIChatCompletionResponse;
  const content = completionData.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    return json({ error: "AI response is empty" }, 502);
  }

  const parsed = parseJsonFromText(content);
  const normalized = normalizeOrganized(parsed);
  if (!normalized) {
    return json({ error: "AI response format invalid" }, 502);
  }

  return json(normalized);
}

