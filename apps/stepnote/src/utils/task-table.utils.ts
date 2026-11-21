import { getCurrentFiscalYear } from "@shared/utils";
import type { IssueRecord, TaskRecord } from "@/db/models/task.model";
import type { LabelRecord } from "@/db/models/navigation.model";
import type { TagRecord } from "@/db/models/tag.model";
import type { TaskIssueCount } from "@/db/queries/task-list.query";
import type { Contact } from "@/types/domain/task-detail.type";
import type {
  TaskTableFilterState,
  TaskTableRowViewModel,
  TaskTableSortKey,
  TaskTableSortState,
} from "@/types/view/task-table-view.type";
import {
  getCompositeTaskDueStatus,
  getTaskDueIconInfo,
  resolveHigherDueStatus,
  type TaskDueIconInfo,
  type TaskDueStatus,
} from "./task-due.utils.js";
import { compareDueDates, matchesTaskKeyword } from "./task-filter.utils.js";

/** 一覧テーブルのデフォルトソート設定 */
export const DEFAULT_TASK_TABLE_SORT: TaskTableSortState = {
  key: "dueDate",
  direction: "asc",
};

const VALID_SORT_KEYS: ReadonlySet<TaskTableSortKey> = new Set([
  "id",
  "status",
  "label",
  "name",
  "dueDate",
  "issues",
]);

/**
 * 関係者一覧から「先頭氏名 +残件数」形式の表示文字列を整形する。
 */
export function formatContactsSummary(
  contacts?: readonly Contact[],
): string {
  if (!contacts || contacts.length === 0) {
    return "-";
  }
  const firstName = contacts[0]?.name?.trim() || "-";
  if (contacts.length === 1) {
    return firstName;
  }
  return `${firstName} +${contacts.length - 1}`;
}

function resolvePriorityDueInfo(
  current: TaskDueIconInfo | undefined,
  candidate: TaskDueIconInfo | null,
): TaskDueIconInfo | undefined {
  if (!candidate) return current;
  const higher = resolveHigherDueStatus(current?.status, candidate.status);
  return higher === candidate.status ? candidate : current;
}

/**
 * タスク配列とIssue配列からタスクIDごとの完了数・総数・最優先期限アイコン情報を集計する。
 */
export function buildTaskIssueCountMap(
  tasks: readonly TaskRecord[],
  issues: readonly IssueRecord[],
): Map<number, TaskIssueCount> {
  const countsMap = new Map<number, TaskIssueCount>();
  for (const task of tasks) {
    if (task.id !== undefined) {
      countsMap.set(task.id, { done: 0, total: 0 });
    }
  }

  for (const issue of issues) {
    const current = countsMap.get(issue.taskId);
    if (!current) continue;
    current.total += 1;
    if (issue.statusCode === 9) {
      current.done += 1;
    } else {
      const nextDue = resolvePriorityDueInfo(
        current.dueIconInfo ?? undefined,
        getTaskDueIconInfo(issue.dueDate),
      );
      if (nextDue) {
        current.dueIconInfo = nextDue;
      }
    }
  }

  return countsMap;
}

/**
 * タスク配列および当年度から利用可能な会計年度一覧を降順・重複なしで抽出する。
 */
export function extractAvailableFiscalYears(
  tasks: readonly TaskRecord[],
  currentYear: number = getCurrentFiscalYear(),
): number[] {
  const years = new Set<number>([currentYear]);
  for (const task of tasks) {
    if (Number.isInteger(task.fiscalYear)) {
      years.add(task.fiscalYear);
    }
  }
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * タスク・Issue集計・ラベル・タグを結合して一覧表示行ビューモデルを構築する。
 */
export function buildTaskTableRows(params: {
  tasks: readonly TaskRecord[];
  issues: readonly IssueRecord[];
  labels: readonly LabelRecord[];
  tags: readonly TagRecord[];
}): TaskTableRowViewModel[] {
  const labelMap = new Map<number, string>();
  for (const label of params.labels) {
    if (label.id !== undefined) {
      labelMap.set(label.id, label.name);
    }
  }

  const tagMap = new Map<number, TagRecord>();
  for (const tag of params.tags) {
    if (tag.id !== undefined) {
      tagMap.set(tag.id, tag);
    }
  }

  const issueCountMap = buildTaskIssueCountMap(params.tasks, params.issues);

  return params.tasks.map((task) => {
    const issueCount =
      task.id !== undefined ? issueCountMap.get(task.id) : undefined;
    const taskTags = (task.tagIds ?? [])
      .map((id) => tagMap.get(id))
      .filter((tag): tag is TagRecord => Boolean(tag));

    return {
      task,
      labelName: labelMap.get(task.labelId) ?? "",
      tags: taskTags,
      issuesDone: issueCount?.done ?? 0,
      issuesTotal: issueCount?.total ?? 0,
      issuesDueInfo: issueCount?.dueIconInfo ?? null,
      taskDueInfo:
        task.statusCode === 9 ? null : getTaskDueIconInfo(task.dueDate),
    };
  });
}

function matchesLabelCondition(
  taskLabelId: number,
  filterLabelId: TaskTableFilterState["labelId"],
): boolean {
  if (filterLabelId === "all") return true;
  if (filterLabelId === "uncategorized") {
    return !taskLabelId || taskLabelId === 0;
  }
  return taskLabelId === filterLabelId;
}

function matchesDueCondition(
  row: TaskTableRowViewModel,
  dueFilter: TaskTableFilterState["dueFilter"],
): boolean {
  if (dueFilter === "all") return true;
  const issueStatus: TaskDueStatus | null = row.issuesDueInfo?.status ?? null;
  const compositeStatus = getCompositeTaskDueStatus(row.task, issueStatus);
  return compositeStatus === dueFilter;
}

function matchesKeywordCondition(
  row: TaskTableRowViewModel,
  keyword: string,
  matchedKeywordTaskIds?: ReadonlySet<number>,
): boolean {
  const trimmed = keyword.trim();
  if (!trimmed) return true;
  if (matchedKeywordTaskIds) {
    return row.task.id !== undefined && matchedKeywordTaskIds.has(row.task.id);
  }
  return matchesTaskKeyword(
    row.task,
    trimmed,
    row.tags.map((t) => t.name),
  );
}

function matchesTableRowFilter(
  row: TaskTableRowViewModel,
  filter: TaskTableFilterState,
  matchedKeywordTaskIds?: ReadonlySet<number>,
): boolean {
  if (filter.fiscalYear !== "all" && row.task.fiscalYear !== filter.fiscalYear) {
    return false;
  }
  if (filter.statusCode !== "all" && row.task.statusCode !== filter.statusCode) {
    return false;
  }
  if (!matchesLabelCondition(row.task.labelId, filter.labelId)) {
    return false;
  }
  if (filter.tagId !== "all" && !(row.task.tagIds ?? []).includes(filter.tagId)) {
    return false;
  }
  if (!matchesDueCondition(row, filter.dueFilter)) {
    return false;
  }
  return matchesKeywordCondition(row, filter.keyword, matchedKeywordTaskIds);
}

/**
 * 複合フィルタ条件に基づいて一覧行を絞り込む。
 */
export function filterTaskTableRows(
  rows: readonly TaskTableRowViewModel[],
  filter: TaskTableFilterState,
  matchedKeywordTaskIds?: ReadonlySet<number>,
): TaskTableRowViewModel[] {
  return rows.filter((row) =>
    matchesTableRowFilter(row, filter, matchedKeywordTaskIds),
  );
}

function compareIssueProgress(
  a: TaskTableRowViewModel,
  b: TaskTableRowViewModel,
): number {
  const scoreA = a.issuesTotal === 0 ? -1 : a.issuesDone / a.issuesTotal;
  const scoreB = b.issuesTotal === 0 ? -1 : b.issuesDone / b.issuesTotal;
  if (scoreA !== scoreB) {
    return scoreA - scoreB;
  }
  return a.issuesTotal - b.issuesTotal;
}

const ROW_COMPARATORS: Record<
  TaskTableSortKey,
  (a: TaskTableRowViewModel, b: TaskTableRowViewModel) => number
> = {
  id: (a, b) => (a.task.id ?? 0) - (b.task.id ?? 0),
  status: (a, b) => a.task.statusCode - b.task.statusCode,
  label: (a, b) =>
    a.labelName.localeCompare(b.labelName, "ja", { numeric: true }),
  name: (a, b) =>
    a.task.name.localeCompare(b.task.name, "ja", { numeric: true }),
  dueDate: (a, b) => compareDueDates(a.task.dueDate, b.task.dueDate),
  issues: compareIssueProgress,
};

/**
 * 指定されたソート設定に従って一覧行を並び替える（元の配列を変更しない）。
 */
export function sortTaskTableRows(
  rows: readonly TaskTableRowViewModel[],
  sortState: TaskTableSortState,
): TaskTableRowViewModel[] {
  const comparator = ROW_COMPARATORS[sortState.key];
  const factor = sortState.direction === "desc" ? -1 : 1;

  return [...rows].sort((a, b) => {
    const diff = comparator(a, b);
    if (diff !== 0) {
      return diff * factor;
    }
    return (a.task.id ?? 0) - (b.task.id ?? 0);
  });
}

/**
 * ストレージ保存値から安全なソート状態へ正規化する。
 */
export function normalizeTaskTableSortState(raw: unknown): TaskTableSortState {
  if (typeof raw !== "string" || !raw) {
    return { ...DEFAULT_TASK_TABLE_SORT };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<TaskTableSortState>;
    const key =
      parsed.key && VALID_SORT_KEYS.has(parsed.key)
        ? parsed.key
        : DEFAULT_TASK_TABLE_SORT.key;
    const direction =
      parsed.direction === "asc" || parsed.direction === "desc"
        ? parsed.direction
        : DEFAULT_TASK_TABLE_SORT.direction;
    return { key, direction };
  } catch {
    return { ...DEFAULT_TASK_TABLE_SORT };
  }
}

/**
 * ストレージ保存値から安全な会計年度フィルタ値へ正規化する。
 */
export function normalizeTaskTableFiscalYear(raw: unknown): number | "all" {
  if (typeof raw !== "string" || !raw || raw === "all") {
    return "all";
  }
  const num = Number(raw);
  return Number.isInteger(num) && num > 0 ? num : "all";
}
