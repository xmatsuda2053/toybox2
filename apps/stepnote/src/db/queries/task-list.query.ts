import { isOverdue, isAsap, isWithinAnyDaysBefore } from "@shared/utils";
import type { Database } from "../schema/database.schema";
import type { TaskRecord } from "../models/task.model";
import type { QuickAccessRecord } from "../models/navigation.model";
import type { QuickAccessTaskCounts } from "@/types/view/navigation-view.type";
import {
  applyQuickAccessFilter,
  sortTasksByDueDateAndName,
} from "@/utils/task-filter.utils";
import {
  getTaskDueIconInfo,
  type TaskDueIconInfo,
} from "@/utils/task-due.utils";

/**
 * タスク一覧の抽出条件オプション
 *
 * @export
 * @interface TaskFilterOptions
 */
export interface TaskFilterOptions {
  /** 対象会計年度（必須） */
  fiscalYear: number;
  /** ラベルIDフィルタ（任意。未指定または undefined の場合は全ラベル） */
  labelId?: number;
  /** QuickAccess フィルタ設定（任意） */
  quickAccess?: Partial<QuickAccessRecord>;
  /** 横断検索キーワード（任意。空文字・空白のみの場合は検索除外なし） */
  searchKeyword?: string;
}

/**
 * Task List ペイン向けの複数テーブル横断検索および複合条件フィルタリングを提供するクエリサービスクラス
 *
 * @export
 * @class TaskListQuery
 */
export class TaskListQuery {
  /**
   * Creates an instance of TaskListQuery.
   * @param {Database} db データベースインスタンス
   * @memberof TaskListQuery
   */
  constructor(private readonly db: Database) {}

  /**
   * 指定した検索キーワードに部分一致するタスクIDのセットを、複数テーブル（tasks, issues, logs, notes）から横断検索して取得する。
   *
   * @param {string} keyword 検索キーワード
   * @return {*}  {Promise<Set<number>>} 合致したタスクIDのSet
   * @memberof TaskListQuery
   */
  public async searchTaskIds(keyword: string): Promise<Set<number>> {
    const term = keyword.trim().toLowerCase();
    const matchedIds = new Set<number>();

    if (term === "") {
      return matchedIds;
    }

    await this.collectTaskIdsFromTasks(term, matchedIds);
    await this.collectTaskIdsFromSubItems(term, matchedIds);

    return matchedIds;
  }

  /**
   * tasks テーブルからキーワードに一致するタスクIDを収集する。
   */
  private async collectTaskIdsFromTasks(
    term: string,
    matchedIds: Set<number>,
  ): Promise<void> {
    const tasks = await this.db.tasks.toArray();
    for (const task of tasks) {
      if (
        task.id !== undefined &&
        (task.name.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term))
      ) {
        matchedIds.add(task.id);
      }
    }
  }

  /**
   * issues, logs, notes テーブルからキーワードに一致する親タスクIDを収集する。
   */
  private async collectTaskIdsFromSubItems(
    term: string,
    matchedIds: Set<number>,
  ): Promise<void> {
    const [issues, logs, notes] = await Promise.all([
      this.db.issues.toArray(),
      this.db.logs.toArray(),
      this.db.notes.toArray(),
    ]);

    for (const issue of issues) {
      if (
        issue.taskId !== undefined &&
        (issue.title.toLowerCase().includes(term) ||
          issue.value.toLowerCase().includes(term))
      ) {
        matchedIds.add(issue.taskId);
      }
    }

    for (const item of [...logs, ...notes]) {
      if (item.taskId !== undefined && item.value.toLowerCase().includes(term)) {
        matchedIds.add(item.taskId);
      }
    }
  }

  /**
   * 指定した複合条件（年度、ラベル、QuickAccess、検索キーワード）に基づき、
   * タスク一覧を抽出・ソート（期限昇順 → タスク名昇順）して取得する。
   *
   * @param {TaskFilterOptions} options 抽出条件
   * @return {*}  {Promise<TaskRecord[]>} フィルタ・ソート済みのタスク一覧
   * @memberof TaskListQuery
   */
  public async getFilteredTasks(
    options: TaskFilterOptions,
  ): Promise<TaskRecord[]> {
    let tasks = await this.db.tasks
      .where("fiscalYear")
      .equals(options.fiscalYear)
      .toArray();

    const trimmedKeyword = (options.searchKeyword ?? "").trim();
    if (trimmedKeyword !== "") {
      const matchedIds = await this.searchTaskIds(trimmedKeyword);
      tasks = tasks.filter((t) => t.id !== undefined && matchedIds.has(t.id));
    }

    if (options.labelId !== undefined) {
      tasks = tasks.filter((t) => t.labelId === options.labelId);
    }

    if (options.quickAccess) {
      tasks = applyQuickAccessFilter(tasks, options.quickAccess);
    }

    return sortTasksByDueDateAndName(tasks);
  }

  /**
   * 指定した会計年度のタスク一覧を取得する。
   *
   * @private
   * @param {number} fiscalYear 対象会計年度
   * @return {Promise<TaskRecord[]>} タスク一覧
   * @memberof TaskListQuery
   */
  private async getTasksByFiscalYear(
    fiscalYear: number,
  ): Promise<TaskRecord[]> {
    return this.db.tasks.where("fiscalYear").equals(fiscalYear).toArray();
  }

  /**
   * 指定した会計年度に属するタスクを対象に、各 QuickAccess フィルター条件の該当件数を集計して取得する。
   *
   * @param {number} fiscalYear 対象会計年度
   * @return {*}  {Promise<QuickAccessTaskCounts>} 各属性の該当タスク件数
   * @memberof TaskListQuery
   */
  public async getQuickAccessTaskCounts(
    fiscalYear: number,
  ): Promise<QuickAccessTaskCounts> {
    const tasks = await this.getTasksByFiscalYear(fiscalYear);
    return calculateQuickAccessTaskCounts(tasks);
  }

  /**
   * タスク一覧から各 QuickAccess フィルターの該当件数を集計する。
   *
   * @param {readonly TaskRecord[]} tasks 対象タスク一覧
   * @return {*}  {QuickAccessTaskCounts} 集計結果
   * @memberof TaskListQuery
   */
  public calculateQuickAccessTaskCounts(
    tasks: readonly TaskRecord[],
  ): QuickAccessTaskCounts {
    return calculateQuickAccessTaskCounts(tasks);
  }

  /**
   * 指定した会計年度に属するタスクを対象に、各タスクに紐づく Issue の完了件数と総件数を集計して取得する。
   *
   * @param {number} fiscalYear 対象会計年度
   * @return {*}  {Promise<Map<number, TaskIssueCount>>} タスクIDごとの集計Map
   * @memberof TaskListQuery
   */
  public async getTaskIssueCounts(
    fiscalYear: number,
  ): Promise<Map<number, TaskIssueCount>> {
    const tasks = await this.getTasksByFiscalYear(fiscalYear);

    const countsMap = new Map<number, TaskIssueCount>();
    for (const task of tasks) {
      if (task.id !== undefined) {
        countsMap.set(task.id, { done: 0, total: 0 });
      }
    }

    const issues = await this.db.issues.toArray();
    for (const issue of issues) {
      const current = countsMap.get(issue.taskId);
      if (current) {
        current.total += 1;
        if (issue.statusCode === 9) {
          current.done += 1;
        } else {
          updateTaskIssueDueInfo(current, issue.dueDate);
        }
      }
    }

    return countsMap;
  }
}

/**
 * タスクごとの Issue 集計件数情報
 */
export interface TaskIssueCount {
  done: number;
  total: number;
  dueIconInfo?: TaskDueIconInfo | null;
}

/**
 * 未完了Issueの期限ステータスを集計情報へ最優先（overdue > asap > upcoming）で反映する。
 */
function updateTaskIssueDueInfo(
  current: TaskIssueCount,
  dueDate?: Date | string | null,
): void {
  const info = getTaskDueIconInfo(dueDate);
  if (!info) return;

  if (info.status === "overdue") {
    current.dueIconInfo = info;
  } else if (info.status === "asap" && current.dueIconInfo?.status !== "overdue") {
    current.dueIconInfo = info;
  } else if (info.status === "upcoming" && !current.dueIconInfo) {
    current.dueIconInfo = info;
  }
}

interface DueAlertCounts {
  overdue: number;
  asap: number;
  upcoming: number;
}

/**
 * 未完了タスクの期限日を判定し、期限警告件数を加算する。
 */
function updateDueAlertCounts(dueDate: Date, counts: DueAlertCounts): void {
  if (isOverdue(dueDate)) {
    counts.overdue += 1;
  }
  if (isAsap(dueDate)) {
    counts.asap += 1;
  }
  if (isWithinAnyDaysBefore(dueDate, 3)) {
    counts.upcoming += 1;
  }
}

/**
 * タスク一覧から各 QuickAccess フィルターの該当件数を集計する純粋関数。
 *
 * @export
 * @param {readonly TaskRecord[]} tasks 対象タスク一覧
 * @return {*}  {QuickAccessTaskCounts} 集計結果
 */
export function calculateQuickAccessTaskCounts(
  tasks: readonly TaskRecord[],
): QuickAccessTaskCounts {
  let bookmark = 0;
  let uncategorized = 0;
  const dueCounts: DueAlertCounts = {
    overdue: 0,
    asap: 0,
    upcoming: 0,
  };

  for (const task of tasks) {
    if (task.bookmark) {
      bookmark += 1;
    }
    if (!task.labelId || task.labelId === 0) {
      uncategorized += 1;
    }
    // 期限警告系は未完了タスク（対応中・開始待ち、statusCode !== 9）のみをカウント
    if (task.statusCode !== 9) {
      updateDueAlertCounts(new Date(task.dueDate), dueCounts);
    }
  }

  return {
    bookmark,
    uncategorized,
    ...dueCounts,
  };
}

