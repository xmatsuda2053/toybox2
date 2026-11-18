import type { ReactiveControllerHost } from "lit";
import { getCurrentFiscalYear } from "@shared/utils";
import type { TaskRepository } from "@/repositories/task.repository";
import type { TaskRecord } from "@/db/models/task.model";
import type { QuickAccessRecord } from "@/db/models/navigation.model";
import {
  type TaskListQuery,
  type TaskIssueCount,
  calculateQuickAccessTaskCounts,
} from "@/db/queries/task-list.query";
import type { QuickAccessTaskCounts } from "@/types/view/navigation-view.type";
import {
  applyQuickAccessFilter,
  matchesTaskKeyword,
  sortTasksByDueDateAndName,
} from "@/utils/task-filter.utils";
import { BaseDataController } from "./base-reactive.controller";

/**
 * Task List ペインにおけるタスク一覧および年度・検索・フィルタ状態を管理する Reactive Controller
 *
 * @export
 * @class TaskListController
 * @extends {BaseDataController<TaskRepository, readonly TaskRecord[]>}
 */
export class TaskListController extends BaseDataController<
  TaskRepository,
  readonly TaskRecord[]
> {
  private _fiscalYear: number;
  private _labelId?: number;
  private _searchKeyword: string = "";
  private _quickAccess?: Partial<QuickAccessRecord>;
  private _query?: TaskListQuery;
  private _tasks: readonly TaskRecord[] = [];
  private _quickAccessTaskCounts: QuickAccessTaskCounts = {};
  private _taskIssueCounts: Map<number, TaskIssueCount> = new Map();

  /**
   * フィルター適用前の選択中会計年度における全タスク一覧
   *
   * @readonly
   * @type {readonly TaskRecord[]}
   * @memberof TaskListController
   */
  public get tasks(): readonly TaskRecord[] {
    return this._tasks;
  }

  /**
   * 選択中会計年度の全タスクに紐づく Issue 集計件数合計（完了数・総数）
   *
   * @readonly
   * @type {{ done: number; total: number }}
   * @memberof TaskListController
   */
  public get fiscalYearIssueCounts(): { done: number; total: number } {
    let done = 0;
    let total = 0;
    for (const counts of this._taskIssueCounts.values()) {
      done += counts.done;
      total += counts.total;
    }
    return { done, total };
  }

  /**
   * 現在選択中の会計年度
   *
   * @readonly
   * @type {number}
   * @memberof TaskListController
   */
  public get fiscalYear(): number {
    return this._fiscalYear;
  }

  /**
   * 現在選択中のラベルIDフィルタ
   *
   * @readonly
   * @type {(number | undefined)}
   * @memberof TaskListController
   */
  public get labelId(): number | undefined {
    return this._labelId;
  }

  /**
   * 現在設定されている検索キーワード
   *
   * @readonly
   * @type {string}
   * @memberof TaskListController
   */
  public get searchKeyword(): string {
    return this._searchKeyword;
  }

  /**
   * 現在設定されている QuickAccess フィルター設定
   *
   * @readonly
   * @type {(Readonly<Partial<QuickAccessRecord>> | undefined)}
   * @memberof TaskListController
   */
  public get quickAccess(): Readonly<Partial<QuickAccessRecord>> | undefined {
    return this._quickAccess;
  }

  /**
   * 現在選択中の会計年度における QuickAccess 各項目のタスク集計件数
   *
   * @readonly
   * @type {QuickAccessTaskCounts}
   * @memberof TaskListController
   */
  public get quickAccessTaskCounts(): QuickAccessTaskCounts {
    return this._quickAccessTaskCounts;
  }

  /**
   * Creates an instance of TaskListController.
   * @param {ReactiveControllerHost} host ホストコンポーネント
   * @param {TaskRepository} repository タスクリポジトリ
   * @param {number} [fiscalYear=getCurrentFiscalYear()] 初期対象年度
   * @param {TaskListQuery} [query] 横断検索およびクエリサービス（任意）
   * @memberof TaskListController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: TaskRepository,
    fiscalYear: number = getCurrentFiscalYear(),
    query?: TaskListQuery,
  ) {
    super(host, repository, []);
    this._fiscalYear = fiscalYear;
    this._query = query;
  }

  /**
   * 現在の会計年度、ラベル、QuickAccess、検索キーワードに合致するタスクレコードを取得・ソートし、全購読者へ通知する。
   *
   * @protected
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  protected async loadState(): Promise<void> {
    const allTasks = await this.repository.getByFiscalYear(this._fiscalYear);
    this._tasks = allTasks;

    if (this._query) {
      this._state = await this._query.getFilteredTasks({
        fiscalYear: this._fiscalYear,
        labelId: this._labelId,
        quickAccess: this._quickAccess,
        searchKeyword: this._searchKeyword,
      });
      this._quickAccessTaskCounts =
        await this._query.getQuickAccessTaskCounts(this._fiscalYear);
      this._taskIssueCounts =
        await this._query.getTaskIssueCounts(this._fiscalYear);
      this.notify();
      return;
    }

    this._state = this.filterTasksInMemory(allTasks);
    this._quickAccessTaskCounts = calculateQuickAccessTaskCounts(allTasks);
    this._taskIssueCounts = new Map();
    this.notify();
  }

  /**
   * 指定したタスクIDの Issue 進捗件数（完了数・総数）を取得する。
   *
   * @param {number} taskId 対象タスクID
   * @return {TaskIssueCount} 進捗件数
   * @memberof TaskListController
   */
  public getTaskIssueCount(taskId: number): TaskIssueCount {
    return this._taskIssueCounts.get(taskId) ?? { done: 0, total: 0 };
  }

  /**
   * インメモリでタスク一覧をフィルタリングおよびソートする（Query 未指定時のフォールバック）
   */
  private filterTasksInMemory(tasks: readonly TaskRecord[]): readonly TaskRecord[] {
    let filtered = [...tasks];
    const term = this._searchKeyword.trim().toLowerCase();

    if (term !== "") {
      filtered = filtered.filter((t) => matchesTaskKeyword(t, term));
    }

    if (this._labelId !== undefined) {
      filtered = filtered.filter((t) => t.labelId === this._labelId);
    }

    if (this._quickAccess) {
      filtered = applyQuickAccessFilter(filtered, this._quickAccess);
    }

    return sortTasksByDueDateAndName(filtered);
  }

  /**
   * 表示対象の会計年度を変更し、タスク一覧を再読み込みする。
   * 指定年度が現在と同じ場合は処理をスキップする。
   *
   * @param {number} fiscalYear 変更後の会計年度
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public setFiscalYear = async (fiscalYear: number): Promise<void> => {
    if (this._fiscalYear === fiscalYear) {
      return;
    }
    this._fiscalYear = fiscalYear;
    await this.loadState();
  };

  /**
   * 表示対象のラベルフィルタを変更し、タスク一覧を再読み込みする。
   *
   * @param {(number | undefined)} labelId 絞り込み対象のラベルID（全件時は undefined）
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public setLabelFilter = async (labelId?: number): Promise<void> => {
    if (this._labelId === labelId) {
      return;
    }
    this._labelId = labelId;
    await this.loadState();
  };

  /**
   * 検索キーワードを設定し、タスク一覧を再読み込みする。
   * 前後の空白をトリムした値が現在のキーワードと同一の場合は処理をスキップする。
   *
   * @param {string} keyword 検索キーワード
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public setSearchKeyword = async (keyword: string): Promise<void> => {
    const trimmed = keyword.trim();
    if (this._searchKeyword === trimmed) {
      return;
    }
    this._searchKeyword = trimmed;
    await this.loadState();
  };

  /**
   * QuickAccess フィルター設定を反映し、タスク一覧を再読み込みする。
   *
   * @param {Partial<QuickAccessRecord>} [quickAccess] QuickAccess 状態
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public setQuickAccessFilter = async (
    quickAccess?: Partial<QuickAccessRecord>,
  ): Promise<void> => {
    this._quickAccess = quickAccess ? { ...quickAccess } : undefined;
    await this.loadState();
  };

  /**
   * 指定したIDのタスクを選択状態にし、一覧を再読み込みする。
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public selectTask = async (id: number): Promise<void> => {
    await this.repository.select(id);
    await this.loadState();
  };

  /**
   * 指定したIDのタスクのブックマーク状態を反転更新し、一覧を再読み込みする。
   *
   * @param {number} id
   * @param {boolean} currentBookmark 現在のブックマーク状態
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public toggleBookmark = async (
    id: number,
    currentBookmark: boolean,
  ): Promise<void> => {
    await this.repository.update(id, { bookmark: !currentBookmark });
    await this.loadState();
  };

  /**
   * hostConnected
   *
   * @memberof TaskListController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof TaskListController
   */
  hostDisconnected(): void {}
}

