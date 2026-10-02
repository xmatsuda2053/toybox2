import { isOverdue, isAsap, isWithinAnyDaysBefore } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
import type { QuickAccessRecord } from "@/db/models/navigation.model";

/**
 * 期限属性フィルターの合致判定を行う。
 *
 * @param {Date} dueDate 判定対象タスクの期限日
 * @param {Partial<QuickAccessRecord>} qa クイックアクセス設定
 * @return {boolean} フィルター条件に合致する場合は true
 */
export function matchesDueDateFilter(
  dueDate: Date,
  qa: Partial<QuickAccessRecord>,
): boolean {
  if (qa.isOverdueSelected && !isOverdue(dueDate)) return false;
  if (qa.isAsapSelected && !isAsap(dueDate)) return false;
  if (qa.isUpcomingSelected && !isWithinAnyDaysBefore(dueDate, 3)) return false;
  return true;
}

/**
 * ステータス表示/非表示フィルターの合致判定を行う。
 *
 * @param {number} statusCode 判定対象タスクのステータスコード
 * @param {Partial<QuickAccessRecord>} qa クイックアクセス設定
 * @return {boolean} フィルター条件に合致する場合は true
 */
export function matchesStatusFilter(
  statusCode: number,
  qa: Partial<QuickAccessRecord>,
): boolean {
  if (qa.isDoneSelected === false && statusCode === 9) return false;
  if (qa.isProgressSelected === false && statusCode === 5) return false;
  if (qa.isPendingSelected === false && statusCode === 0) return false;
  return true;
}

/**
 * QuickAccess フィルター条件をタスク一覧に適用し、該当タスクのみを抽出する。
 *
 * @param {TaskRecord[]} tasks フィルター対象のタスク配列
 * @param {Partial<QuickAccessRecord>} qa クイックアクセス設定
 * @return {TaskRecord[]} フィルター適用後のタスク配列
 */
export function applyQuickAccessFilter(
  tasks: TaskRecord[],
  qa: Partial<QuickAccessRecord>,
): TaskRecord[] {
  return tasks.filter((task) => {
    if (qa.isBookmarkSelected && !task.bookmark) return false;
    if (qa.isUncategorizedSelected && task.labelId && task.labelId !== 0) {
      return false;
    }
    const dueDate =
      task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    if (!matchesDueDateFilter(dueDate, qa)) return false;
    if (!matchesStatusFilter(task.statusCode, qa)) return false;
    return true;
  });
}

/**
 * タスク一覧を期限日昇順、タスク名五十音順でソートする。
 * 元の配列を変更せず、新しいソート済み配列を返す。
 *
 * @param {TaskRecord[]} tasks ソート対象のタスク配列
 * @return {TaskRecord[]} ソート後のタスク配列
 */
export function sortTasksByDueDateAndName(tasks: TaskRecord[]): TaskRecord[] {
  return [...tasks].sort((a, b) => {
    const aTime =
      a.dueDate instanceof Date
        ? a.dueDate.getTime()
        : new Date(a.dueDate).getTime();
    const bTime =
      b.dueDate instanceof Date
        ? b.dueDate.getTime()
        : new Date(b.dueDate).getTime();
    const timeDiff = aTime - bTime;
    return timeDiff !== 0 ? timeDiff : a.name.localeCompare(b.name, "ja");
  });
}
