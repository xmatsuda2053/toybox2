import { isOverdue, isAsap, isWithinAnyDaysBefore } from "@shared/utils";
import type { Database } from "../schema/database.schema";
import type { TaskRecord } from "../models/task.model";
import type { QuickAccessRecord } from "../models/navigation.model";

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
      tasks = this.applyQuickAccessFilter(tasks, options.quickAccess);
    }

    return this.sortTasks(tasks);
  }

  /**
   * QuickAccess フィルター条件をタスク一覧に適用する。
   */
  private applyQuickAccessFilter(
    tasks: TaskRecord[],
    qa: Partial<QuickAccessRecord>,
  ): TaskRecord[] {
    return tasks.filter((task) => {
      if (qa.isBookmarkSelected && !task.bookmark) return false;
      if (qa.isUncategorizedSelected && task.labelId && task.labelId !== 0) {
        return false;
      }
      if (!this.matchesDueDateFilter(new Date(task.dueDate), qa)) return false;
      if (!this.matchesStatusFilter(task.statusCode, qa)) return false;
      return true;
    });
  }

  /** 期限属性フィルターの合致判定 */
  private matchesDueDateFilter(
    dueDate: Date,
    qa: Partial<QuickAccessRecord>,
  ): boolean {
    if (qa.isOverdueSelected && !isOverdue(dueDate)) return false;
    if (qa.isAsapSelected && !isAsap(dueDate)) return false;
    if (qa.isUpcomingSelected && !isWithinAnyDaysBefore(dueDate, 3)) return false;
    return true;
  }

  /** ステータス表示/非表示フィルターの合致判定 */
  private matchesStatusFilter(
    statusCode: number,
    qa: Partial<QuickAccessRecord>,
  ): boolean {
    if (qa.isDoneSelected === false && statusCode === 9) return false;
    if (qa.isProgressSelected === false && statusCode === 5) return false;
    if (qa.isPendingSelected === false && statusCode === 0) return false;
    return true;
  }

  /**
   * タスク一覧を期限日昇順、タスク名五十音順でソートする。
   */
  private sortTasks(tasks: TaskRecord[]): TaskRecord[] {
    return tasks.sort((a, b) => {
      const timeDiff =
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return timeDiff !== 0 ? timeDiff : a.name.localeCompare(b.name, "ja");
    });
  }
}
