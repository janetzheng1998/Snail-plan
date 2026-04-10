export type PlanStatus = "active" | "completed";
export type ProgressUnit = "次" | "天" | "小时" | "不定时";
export type RecordUnit = "分钟" | "次" | "天" | "小时";

export type OrganizedRecord = {
  completed_content: string;
  problems: string[];
  next_suggestions: string[];
};

export type PlanRecord = {
  id: string;
  date: string;
  raw_text: string;
  duration_value: number;
  duration_unit: RecordUnit;
  organized: OrganizedRecord;
};

export type Plan = {
  id: string;
  title: string;
  category: "学习提升" | "日常训练" | "职场成长" | "习惯养成" | "项目推进";
  description: string;
  status: PlanStatus;
  started_at: string;
  updated_at: string;
  completed_at?: string;
  target_value: number;
  current_value: number;
  progress_unit: ProgressUnit;
  records: PlanRecord[];
};

export const planCategories = [
  "学习提升",
  "日常训练",
  "职场成长",
  "习惯养成",
  "项目推进"
] as const;

export const progressUnits = ["次", "天", "小时", "不定时"] as const;

export const recordUnits = ["分钟", "次", "天", "小时"] as const;

export const plans: Plan[] = [
  {
    id: "voice-lesson-10",
    title: "声乐课学习（10节）",
    category: "学习提升",
    description: "持续完成 10 节声乐课程，并通过每次记录优化发声稳定性。",
    status: "active",
    started_at: "2026-03-12",
    updated_at: "2026-04-02",
    target_value: 10,
    current_value: 3,
    progress_unit: "次",
    records: [
      {
        id: "voice-r3",
        date: "2026-04-02",
        raw_text:
          "今天做了共鸣练习和气息控制，后半段高音还是容易飘，老师提醒我咬字时不要压喉。",
        duration_value: 60,
        duration_unit: "分钟",
        organized: {
          completed_content: "完成 60 分钟共鸣与气息训练，巩固了中音区稳定度。",
          problems: ["高音区换声点不稳定", "咬字时喉部容易紧张"],
          next_suggestions: [
            "下一次先做 8 分钟唇颤热身再进高音练习",
            "针对高音句做慢速分解，每句重复 3 轮"
          ]
        }
      },
      {
        id: "voice-r2",
        date: "2026-03-28",
        raw_text: "练了呼吸和节奏，录音对比发现尾音控制有进步。",
        duration_value: 1,
        duration_unit: "次",
        organized: {
          completed_content: "完成一次基础呼吸与节奏训练并产出录音对比。",
          problems: ["长句尾音收束仍不够干净"],
          next_suggestions: ["增加长句尾音单独训练 10 分钟"]
        }
      },
      {
        id: "voice-r1",
        date: "2026-03-21",
        raw_text: "第一次系统训练，知道了自己的发声弱点，节奏还行。",
        duration_value: 1,
        duration_unit: "次",
        organized: {
          completed_content: "完成首次系统声乐训练并识别主要发声弱点。",
          problems: ["发声位置靠后，声音偏闷"],
          next_suggestions: ["每天增加 5 分钟哼鸣位置练习"]
        }
      }
    ]
  },
  {
    id: "daily-speaking-30",
    title: "晨间表达训练（30天）",
    category: "习惯养成",
    description: "连续 30 天进行晨间表达输出，提升表达流畅度与逻辑组织。",
    status: "active",
    started_at: "2026-03-20",
    updated_at: "2026-04-01",
    target_value: 30,
    current_value: 9,
    progress_unit: "天",
    records: [
      {
        id: "speak-r9",
        date: "2026-04-01",
        raw_text: "今天做了 15 分钟口头表达，开头卡顿比之前少。",
        duration_value: 15,
        duration_unit: "分钟",
        organized: {
          completed_content: "完成 15 分钟晨间表达训练，开场状态更稳定。",
          problems: ["中段论点展开不够充分"],
          next_suggestions: ["下次提前写 3 个关键词作为中段提纲"]
        }
      }
    ]
  },
  {
    id: "running-endurance-20h",
    title: "跑步耐力训练（20小时）",
    category: "日常训练",
    description: "累计 20 小时跑步训练，建立基础耐力与恢复节奏。",
    status: "completed",
    started_at: "2026-01-03",
    updated_at: "2026-03-26",
    completed_at: "2026-03-26",
    target_value: 20,
    current_value: 20,
    progress_unit: "小时",
    records: [
      {
        id: "run-r20",
        date: "2026-03-26",
        raw_text: "最后一次长跑 70 分钟，配速稳定，完成目标。",
        duration_value: 70,
        duration_unit: "分钟",
        organized: {
          completed_content: "完成收官长跑并达成 20 小时总训练时长。",
          problems: ["后半程补水策略还可优化"],
          next_suggestions: ["后续尝试分段补水，减少末段疲劳波动"]
        }
      }
    ]
  },
  {
    id: "prompt-writing-15",
    title: "Prompt 写作训练（15次）",
    category: "职场成长",
    description: "通过 15 次刻意训练提升提示词结构化表达能力。",
    status: "completed",
    started_at: "2025-10-02",
    updated_at: "2025-12-28",
    completed_at: "2025-12-28",
    target_value: 15,
    current_value: 15,
    progress_unit: "次",
    records: [
      {
        id: "prompt-r15",
        date: "2025-12-28",
        raw_text: "完成最后一轮 A/B 测试，模板稳定了。",
        duration_value: 1,
        duration_unit: "次",
        organized: {
          completed_content: "完成最终轮提示词模板验证并固化框架。",
          problems: ["跨任务迁移时的边界条件仍需补全"],
          next_suggestions: ["补充 5 个异常场景模板"]
        }
      }
    ]
  }
];

export type PlanSummary = {
  plan_id: string;
  completion_note: string;
  key_gains: string[];
  recurring_issues: string[];
  next_phase_actions: string[];
  final_reflection: string;
};

export const planSummaries: Record<string, PlanSummary> = {
  "voice-lesson-10": {
    plan_id: "voice-lesson-10",
    completion_note: "你已将这个阶段收尾，所有关键练习都沉淀成了可复用的方法。",
    key_gains: [
      "完成从零散练习到连续课程学习的转变",
      "高音稳定性比初期明显提升",
      "建立了“训练-记录-改进”的固定闭环"
    ],
    recurring_issues: ["高音句尾控制波动", "疲劳时喉部紧张复发"],
    next_phase_actions: [
      "下一阶段新增每周一次完整录音复盘",
      "加入曲目表达训练，不只关注发声技巧",
      "持续追踪每节课后的恢复效率"
    ],
    final_reflection: "慢慢走，但每一步都算数。你已经拥有了能长期坚持的节奏。"
  },
  "running-endurance-20h": {
    plan_id: "running-endurance-20h",
    completion_note: "计划已完成，累计达到 20/20 小时。",
    key_gains: ["耐力显著提升", "配速更稳定", "恢复窗口更可控"],
    recurring_issues: ["末段补水策略不足"],
    next_phase_actions: ["尝试分段补水", "加入力量交叉训练"],
    final_reflection: "坚持把你带到了终点，下一段旅程可以更轻松也更聪明。"
  }
};

export const growthOverview = {
  active_plan_count: plans.filter((plan) => plan.status === "active").length,
  completed_plan_count: plans.filter((plan) => plan.status === "completed").length,
  total_record_count: plans.reduce((sum, plan) => sum + plan.records.length, 0),
  recent_consistency: "最近 7 天记录 5 次，节奏稳定",
  highlight: "慢一点也没关系，你正在持续前进。"
};

export const mockOrganizedRecord: OrganizedRecord = {
  completed_content: "完成本次训练并明确了 2 个可执行优化动作。",
  problems: ["执行前准备不足，进入状态偏慢", "中段专注度下降导致效果打折"],
  next_suggestions: [
    "下次先做 5 分钟热身并设定单次唯一目标",
    "训练结束后立刻记录 3 行复盘，避免信息遗失"
  ]
};

export function getActivePlans(): Plan[] {
  return plans.filter((plan) => plan.status === "active");
}

export function getCompletedPlans(): Plan[] {
  return plans.filter((plan) => plan.status === "completed");
}

export function getRecentUpdatedPlans(limit = 3): Plan[] {
  return [...plans]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
}

export function getPlanById(planId: string): Plan | undefined {
  return plans.find((plan) => plan.id === planId);
}

export function getPlanSummaryById(planId: string): PlanSummary {
  return (
    planSummaries[planId] ?? {
      plan_id: planId,
      completion_note: "这个阶段已经完成，你的成长路径正在变得更清晰。",
      key_gains: ["形成了可持续记录习惯", "目标拆解更加清晰"],
      recurring_issues: ["复盘量化指标不足"],
      next_phase_actions: ["补充可量化结果", "固定每周一次阶段复盘"],
      final_reflection: "继续保持“记录一小步，成长一大步”的节奏。"
    }
  );
}

export function getProgressPercent(plan: Plan): number {
  if (plan.target_value <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((plan.current_value / plan.target_value) * 100));
}

export function getLatestRecord(plan: Plan): PlanRecord | undefined {
  return [...plan.records].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getPlanCompletionDate(plan: Plan): string {
  return plan.completed_at ?? plan.updated_at;
}

export function getCompletionYears(): number[] {
  const years = getCompletedPlans().map((plan) => Number(getPlanCompletionDate(plan).slice(0, 4)));
  return [...new Set(years)].sort((a, b) => b - a);
}

export function getCompletedPlansByYear(year: number): Plan[] {
  return getCompletedPlans().filter(
    (plan) => Number(getPlanCompletionDate(plan).slice(0, 4)) === year
  );
}

export type YearlySummary = {
  year: number;
  completed_plan_count: number;
  completed_record_count: number;
};

export function getYearlySummary(year: number): YearlySummary {
  const completed = getCompletedPlansByYear(year);

  return {
    year,
    completed_plan_count: completed.length,
    completed_record_count: completed.reduce((sum, plan) => sum + plan.records.length, 0)
  };
}
