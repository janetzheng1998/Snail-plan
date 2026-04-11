import type { PlanRecord, RecordUnit } from "@/lib/mock-data";

const LOCAL_RECORDS_STORAGE_KEY = "snail-plan-local-records";

export type LocalOrganizedRecord = {
  summary: string;
  completedContent: string;
  issues: string[];
  nextActions: string[];
};

export type LocalRecord = {
  id: string;
  planId: string;
  date: string;
  rawText: string;
  organized: LocalOrganizedRecord;
  durationValue?: number;
  durationUnit?: RecordUnit;
};

export type SaveLocalRecordInput = Omit<LocalRecord, "id"> & { id?: string };

function readLocalRecordsFromStorage(): LocalRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_RECORDS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalRecordsToStorage(records: LocalRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_RECORDS_STORAGE_KEY, JSON.stringify(records));
}

export function getLocalRecords(): LocalRecord[] {
  return readLocalRecordsFromStorage();
}

export function getLocalRecordsByPlanId(planId: string): LocalRecord[] {
  return readLocalRecordsFromStorage().filter((record) => record.planId === planId);
}

export function saveLocalRecord(record: SaveLocalRecordInput): LocalRecord {
  const fallbackId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const nextRecord: LocalRecord = {
    ...record,
    id: record.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : fallbackId)
  };
  const existing = readLocalRecordsFromStorage();
  const filtered = existing.filter((item) => item.id !== nextRecord.id);

  writeLocalRecordsToStorage([nextRecord, ...filtered]);
  return nextRecord;
}

export function localRecordToPlanRecord(record: LocalRecord): PlanRecord {
  return {
    id: record.id,
    date: record.date,
    raw_text: record.rawText,
    duration_value: record.durationValue ?? 1,
    duration_unit: record.durationUnit ?? "次",
    organized: {
      completed_content: record.organized.completedContent || record.organized.summary,
      problems: record.organized.issues,
      next_suggestions: record.organized.nextActions
    }
  };
}
