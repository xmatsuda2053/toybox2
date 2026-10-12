import { isOverdue, isAsap, isWithinAnyDaysBefore } from "@shared/utils";
import type { IssueRecord, TaskRecord } from "@/db/models/task.model";
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
 * 期限日（Date インスタンスまたは ISO 文字列）をエポックミリ秒に変換する。
 *
 * @param {Date | string} dueDate 期限日
 * @return {number} エポックミリ秒
 */
export function toDueDateTimestamp(dueDate: Date | string): number {
  return dueDate instanceof Date
    ? dueDate.getTime()
    : new Date(dueDate).getTime();
}

/**
 * 2つの期限日を比較し、昇順ソート用の差分値を返す。
 *
 * @param {Date | string} a 期限日A
 * @param {Date | string} b 期限日B
 * @return {number} 差分ミリ秒（a < b の場合は負数、a > b の場合は正数、同一は 0）
 */
export function compareDueDates(a: Date | string, b: Date | string): number {
  return toDueDateTimestamp(a) - toDueDateTimestamp(b);
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
    const timeDiff = compareDueDates(a.dueDate, b.dueDate);
    return timeDiff !== 0 ? timeDiff : a.name.localeCompare(b.name, "ja");
  });
}

/**
 * Issue（課題）一覧を期限日昇順、タイトル五十音順でソートする。
 * 元の配列を変更せず、新しいソート済み配列を返す。
 *
 * @param {readonly IssueRecord[]} issues ソート対象のIssue配列
 * @return {IssueRecord[]} ソート後のIssue配列
 */
export function sortIssuesByDueDateAndTitle(
  issues: readonly IssueRecord[],
): IssueRecord[] {
  return [...issues].sort((a, b) => {
    const timeDiff = compareDueDates(a.dueDate, b.dueDate);
    return timeDiff !== 0 ? timeDiff : a.title.localeCompare(b.title, "ja");
  });
}

