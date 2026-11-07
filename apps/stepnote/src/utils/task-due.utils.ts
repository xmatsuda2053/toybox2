import { isOverdue, isAsap, isWithinAnyDaysBefore } from "@shared/utils";
import type { IssueRecord } from "@/db/models/task.model";

/**
 * 期限ステータス種別
 */
export type TaskDueStatus = "overdue" | "asap" | "upcoming";

/**
 * 期限ステータスアイコン情報
 *
 * @interface TaskDueIconInfo
 */
export interface TaskDueIconInfo {
  /** アイコン名（Quick Access準拠） */
  icon: string;
  /** ステータス修飾子識別名 */
  status: TaskDueStatus;
}

/**
 * 期限日の状態（期限切れ・期限当日・期限間近）に応じたアイコン情報を取得する。
 * いずれにも該当しない場合、または期限日が未指定・無効な場合は null を返す。
 *
 * @param {Date | string | null | undefined} dueDate 判定対象の期限日
 * @returns {TaskDueIconInfo | null} アイコン情報または null
 */
export function getTaskDueIconInfo(
  dueDate?: Date | string | null,
): TaskDueIconInfo | null {
  if (!dueDate) {
    return null;
  }

  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (isNaN(date.getTime())) {
    return null;
  }

  if (isOverdue(date)) {
    return { icon: "fire-solid-full", status: "overdue" };
  }

  if (isAsap(date)) {
    return { icon: "triangle-exclamation-solid-full", status: "asap" };
  }

  if (isWithinAnyDaysBefore(date, 3)) {
    return { icon: "calendar-solid-full", status: "upcoming" };
  }

  return null;
}

/**
 * 複数のIssueレコードから未完了のものを対象に、最も緊急度の高い期限ステータスアイコン情報を取得する。
 * （優先度: overdue > asap > upcoming）
 * 該当する未完了Issueが存在しない場合は null を返す。
 *
 * @param {readonly IssueRecord[]} issues 対象Issue配列
 * @returns {TaskDueIconInfo | null} 最優先の期限アイコン情報または null
 */
export function getIssuesDueStatus(
  issues: readonly IssueRecord[],
): TaskDueIconInfo | null {
  let hasAsap = false;
  let hasUpcoming = false;

  for (const issue of issues) {
    if (issue.statusCode === 9) continue;
    const dueInfo = getTaskDueIconInfo(issue.dueDate);
    if (!dueInfo) continue;

    if (dueInfo.status === "overdue") {
      return dueInfo;
    }
    if (dueInfo.status === "asap") {
      hasAsap = true;
    } else if (dueInfo.status === "upcoming") {
      hasUpcoming = true;
    }
  }

  if (hasAsap) {
    return { icon: "triangle-exclamation-solid-full", status: "asap" };
  }
  if (hasUpcoming) {
    return { icon: "calendar-solid-full", status: "upcoming" };
  }

  return null;
}

/**
 * 2つの期限ステータスを比較し、より緊急度の高いステータス（overdue > asap > upcoming）を返す。
 *
 * @export
 * @param {TaskDueStatus | null} [statusA] ステータスA
 * @param {TaskDueStatus | null} [statusB] ステータスB
 * @return {TaskDueStatus | null} 最優先ステータスまたは null
 */
export function resolveHigherDueStatus(
  statusA?: TaskDueStatus | null,
  statusB?: TaskDueStatus | null,
): TaskDueStatus | null {
  if (statusA === "overdue" || statusB === "overdue") {
    return "overdue";
  }
  if (statusA === "asap" || statusB === "asap") {
    return "asap";
  }
  if (statusA === "upcoming" || statusB === "upcoming") {
    return "upcoming";
  }
  return null;
}

/**
 * タスク本体と紐づく未完了Issueの期限状態を合成し、最も緊急度の高い期限ステータスを取得する。
 * タスクが完了（statusCode: 9）の場合は常に null を返す。
 *
 * @export
 * @param {{ statusCode: number; dueDate?: Date | string | null }} task 判定対象タスク
 * @param {TaskDueStatus | null} [issueDueStatus] 紐づく未完了Issueの最優先期限ステータス
 * @return {TaskDueStatus | null} 総合期限ステータス（該当なしの場合は null）
 */
export function getCompositeTaskDueStatus(
  task: {
    statusCode: number;
    dueDate?: Date | string | null;
  },
  issueDueStatus?: TaskDueStatus | null,
): TaskDueStatus | null {
  if (task.statusCode === 9) {
    return null;
  }

  const taskDueInfo = getTaskDueIconInfo(task.dueDate);
  return resolveHigherDueStatus(taskDueInfo?.status, issueDueStatus);
}


