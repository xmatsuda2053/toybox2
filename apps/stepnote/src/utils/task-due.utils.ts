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

