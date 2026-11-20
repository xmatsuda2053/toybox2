import { isOverdue, isAsap, isWithinAnyDaysBefore } from "@shared/utils";
import type { Database } from "../schema/database.schema";
import type { TaskRecord } from "../models/task.model";
import type { QuickAccessRecord } from "../models/navigation.model";
import type { QuickAccessTaskCounts } from "@/types/view/navigation-view.type";
import {
  parseSearchTerms,
  type ParsedSearchTerm,
} from "@/utils/global-search.utils";
import {
  applyQuickAccessFilter,
  matchesTagNames,
  matchesTaskKeyword,
  sortTasks,
  type TaskSortMode,
} from "@/utils/task-filter.utils";
import {
  getTaskDueIconInfo,
  getCompositeTaskDueStatus,
  resolveHigherDueStatus,
  type TaskDueIconInfo,
  type TaskDueStatus,
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
  /** ソートモード（任意。未指定時は期限日昇順） */
  sortMode?: TaskSortMode;
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
    const terms = parseSearchTerms(keyword);
    const matchedIds = new Set<number>();
    if (terms.length === 0) {
      return matchedIds;
    }

    const termHitsByTask = new Map<number, Set<string>>();
    await this.collectTaskTermHits(terms, termHitsByTask);
    await this.collectSubItemTermHits(terms, termHitsByTask);

    for (const [taskId, matchedKeys] of termHitsByTask.entries()) {
      if (matchedKeys.size === terms.length) {
        matchedIds.add(taskId);
      }
    }
    return matchedIds;
  }

  /** タスクIDごとのヒットトークンを記録するヘルパー */
  private recordTermHit(
    termHitsByTask: Map<number, Set<string>>,
    taskId: number,
    termKey: string,
  ): void {
    let hitSet = termHitsByTask.get(taskId);
    if (!hitSet) {
      hitSet = new Set<string>();
      termHitsByTask.set(taskId, hitSet);
    }
    hitSet.add(termKey);
  }

  /** タグIDマップを構築し、タスク本体およびタグ名からトークン一致を収集する */
  private async collectTaskTermHits(
    terms: readonly ParsedSearchTerm[],
    termHitsByTask: Map<number, Set<string>>,
  ): Promise<void> {
    const [tasks, tags] = await Promise.all([
      this.db.tasks.toArray(),
      this.db.tags.toArray(),
    ]);
    const tagMap = new Map<number, string>();
    for (const tag of tags) {
      if (tag.id !== undefined) {
        tagMap.set(tag.id, tag.name);
      }
    }

    for (const task of tasks) {
      if (task.id === undefined) continue;
      const tagNames = (task.tagIds ?? [])
        .map((id) => tagMap.get(id))
        .filter((name): name is string => Boolean(name));

      for (const term of terms) {
        const isHit = term.isTagOnly
          ? matchesTagNames(tagNames, term.value)
          : matchesTaskKeyword(task, term.value, tagNames);
        if (isHit) {
          this.recordTermHit(termHitsByTask, task.id, term.raw);
        }
      }
    }
  }

  /** 指定テキスト配列に対して通常トークン一致を収集する共通ヘルパー */
  private collectTextTermHits(
    taskId: number | undefined,
    texts: readonly string[],
    terms: readonly ParsedSearchTerm[],
    termHitsByTask: Map<number, Set<string>>,
  ): void {
    if (taskId === undefined) return;
    const lowerTexts = texts.map((text) => text.toLowerCase());
    for (const term of terms) {
      if (lowerTexts.some((text) => text.includes(term.value))) {
        this.recordTermHit(termHitsByTask, taskId, term.raw);
      }
    }
  }

  /** issues, logs, notes テーブルから通常トークン一致を収集する */
  private async collectSubItemTermHits(
    terms: readonly ParsedSearchTerm[],
    termHitsByTask: Map<number, Set<string>>,
  ): Promise<void> {
    const generalTerms = terms.filter((t) => !t.isTagOnly);
    if (generalTerms.length === 0) return;

    const [issues, logs, notes] = await Promise.all([
      this.db.issues.toArray(),
      this.db.logs.toArray(),
      this.db.notes.toArray(),
    ]);

    for (const issue of issues) {
      this.collectTextTermHits(
        issue.taskId,
        [issue.title, issue.value],
        generalTerms,
        termHitsByTask,
      );
    }

    for (const item of [...logs, ...notes]) {
      this.collectTextTermHits(
        item.taskId,
        [item.value],
        generalTerms,
        termHitsByTask,
      );
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
      const issueStatusMap = await this.getTaskIssueDueStatusMap(tasks);
      tasks = applyQuickAccessFilter(tasks, options.quickAccess, issueStatusMap);
    }

    return sortTasks(tasks, options.sortMode);
  }

  /**
   * 指定したタスク配列に紐づく未完了Issueの最優先期限ステータスマップを取得する。
   *
   * @private
   * @param {readonly TaskRecord[]} tasks 対象タスク一覧
   * @return {Promise<Map<number, TaskDueStatus | null>>} タスクIDごとの最優先期限ステータスマップ
   * @memberof TaskListQuery
   */
  private async getTaskIssueDueStatusMap(
    tasks: readonly TaskRecord[],
  ): Promise<Map<number, TaskDueStatus | null>> {
    const taskIds = new Set(
      tasks
        .map((t) => t.id)
        .filter((id): id is number => id !== undefined),
    );
    if (taskIds.size === 0) {
      return new Map();
    }

    const issues = await this.db.issues.toArray();
    const map = new Map<number, TaskDueStatus | null>();

    for (const issue of issues) {
      if (!taskIds.has(issue.taskId) || issue.statusCode === 9) {
        continue;
      }
      const dueInfo = getTaskDueIconInfo(issue.dueDate);
      if (!dueInfo) continue;

      const current = map.get(issue.taskId);
      map.set(issue.taskId, resolveHigherDueStatus(current, dueInfo.status));
    }

    return map;
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
    const issueStatusMap = await this.getTaskIssueDueStatusMap(tasks);
    return calculateQuickAccessTaskCounts(tasks, issueStatusMap);
  }

  /**
   * タスク一覧から各 QuickAccess フィルターの該当件数を集計する。
   *
   * @param {readonly TaskRecord[]} tasks 対象タスク一覧
   * @param {Map<number, TaskDueStatus | null>} [taskIssueDueStatusMap] タスクIDごとの未完了Issue最優先期限ステータスマップ
   * @return {*}  {QuickAccessTaskCounts} 集計結果
   * @memberof TaskListQuery
   */
  public calculateQuickAccessTaskCounts(
    tasks: readonly TaskRecord[],
    taskIssueDueStatusMap?: Map<number, TaskDueStatus | null>,
  ): QuickAccessTaskCounts {
    return calculateQuickAccessTaskCounts(tasks, taskIssueDueStatusMap);
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
 * 総合期限ステータスに基づき、期限警告件数を加算する。
 */
function updateCompositeDueAlertCounts(
  status: TaskDueStatus | null,
  counts: DueAlertCounts,
): void {
  if (status === "overdue") {
    counts.overdue += 1;
  } else if (status === "asap") {
    counts.asap += 1;
  } else if (status === "upcoming") {
    counts.upcoming += 1;
  }
}

/**
 * 未完了タスク1件分の期限警告件数を集計オブジェクトに加算する。
 */
function updateTaskDueCounts(
  task: TaskRecord,
  counts: DueAlertCounts,
  taskIssueDueStatusMap?: Map<number, TaskDueStatus | null>,
): void {
  if (!taskIssueDueStatusMap) {
    updateDueAlertCounts(new Date(task.dueDate), counts);
    return;
  }
  const issueStatus =
    task.id !== undefined ? (taskIssueDueStatusMap.get(task.id) ?? null) : null;
  const compositeStatus = getCompositeTaskDueStatus(task, issueStatus);
  updateCompositeDueAlertCounts(compositeStatus, counts);
}

/**
 * タスク一覧から各 QuickAccess フィルターの該当件数を集計する純粋関数。
 *
 * @export
 * @param {readonly TaskRecord[]} tasks 対象タスク一覧
 * @param {Map<number, TaskDueStatus | null>} [taskIssueDueStatusMap] タスクIDごとの未完了Issue最優先期限ステータスマップ
 * @return {*}  {QuickAccessTaskCounts} 集計結果
 */
export function calculateQuickAccessTaskCounts(
  tasks: readonly TaskRecord[],
  taskIssueDueStatusMap?: Map<number, TaskDueStatus | null>,
): QuickAccessTaskCounts {
  let bookmark = 0;
  let uncategorized = 0;
  const dueCounts: DueAlertCounts = {
    overdue: 0,
    asap: 0,
    upcoming: 0,
  };

  for (const task of tasks) {
    if (!task.labelId || task.labelId === 0) {
      uncategorized += 1;
    }
    // ブックマークおよび期限警告系は未完了タスク（対応中・開始待ち、statusCode !== 9）のみをカウント
    if (task.statusCode === 9) {
      continue;
    }
    if (task.bookmark) {
      bookmark += 1;
    }
    updateTaskDueCounts(task, dueCounts, taskIssueDueStatusMap);
  }

  return {
    bookmark,
    uncategorized,
    ...dueCounts,
  };
}

