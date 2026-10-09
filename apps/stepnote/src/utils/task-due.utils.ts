import { isOverdue, isAsap, isWithinAnyDaysBefore } from "@shared/utils";

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
