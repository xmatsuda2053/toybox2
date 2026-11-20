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
  normalizeTaskSortMode,
  sortTasks,
  type TaskSortMode,
} from "@/utils/task-filter.utils";
import { BaseDataController } from "./base-reactive.controller";

/**
 * ソートモード永続化用のストレージ互換インターフェース
 */
export interface TaskListStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * TaskListController のオプション設定
 */
export interface TaskListControllerOptions {
  /** ソート設定の保存先ストレージ（デフォルト: window.localStorage） */
  storage?: TaskListStorage;
  /** ストレージの保存キー（デフォルト: 'stepnote_task_list_sort'） */
  storageKey?: string;
}

const DEFAULT_SORT_STORAGE_KEY = "stepnote_task_list_sort";

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
  private _sortMode: TaskSortMode;
  private readonly _storage?: TaskListStorage;
  private readonly _storageKey: string;
  private _query?: TaskListQuery;
  private _tasks: readonly TaskRecord[] = [];
  private _quickAccessTaskCounts: QuickAccessTaskCounts = {};
  private _taskIssueCounts: Map<number, TaskIssueCount> = new Map();
  private _loadRequestId = 0;

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
   * 現在設定されているソートモード
   *
   * @readonly
   * @type {TaskSortMode}
   * @memberof TaskListController
   */
  public get sortMode(): TaskSortMode {
    return this._sortMode;
  }

  /**
   * Creates an instance of TaskListController.
   * @param {ReactiveControllerHost} host ホストコンポーネント
   * @param {TaskRepository} repository タスクリポジトリ
   * @param {number} [fiscalYear=getCurrentFiscalYear()] 初期対象年度
   * @param {TaskListQuery} [query] 横断検索およびクエリサービス（任意）
   * @param {TaskListControllerOptions} [options] 永続化ストレージ等のオプション設定（任意）
   * @memberof TaskListController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: TaskRepository,
    fiscalYear: number = getCurrentFiscalYear(),
    query?: TaskListQuery,
    options?: TaskListControllerOptions,
  ) {
    super(host, repository, []);
    this._fiscalYear = fiscalYear;
    this._query = query;
    this._storageKey = options?.storageKey ?? DEFAULT_SORT_STORAGE_KEY;
    this._storage =
      options?.storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    this._sortMode = this.readSavedSortMode();
  }

  /**
   * ストレージから保存済みソートモードを読み込む
   */
  private readSavedSortMode(): TaskSortMode {
    try {
      const saved = this._storage?.getItem(this._storageKey);
      return normalizeTaskSortMode(saved);
    } catch {
      return normalizeTaskSortMode(undefined);
    }
  }

  /**
   * ソートモードをストレージへ保存する
   */
  private saveSortMode(mode: TaskSortMode): void {
    try {
      this._storage?.setItem(this._storageKey, mode);
    } catch {
      // ストレージ書き込み不可環境では無視する
    }
  }

  /**
   * 現在の会計年度、ラベル、QuickAccess、検索キーワードに合致するタスクレコードを取得・ソートし、全購読者へ通知する。
   *
   * @protected
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  protected async loadState(): Promise<void> {
    const requestId = ++this._loadRequestId;
    const fiscalYear = this._fiscalYear;
    const labelId = this._labelId;
    const quickAccess = this._quickAccess ? { ...this._quickAccess } : undefined;
    const searchKeyword = this._searchKeyword;
    const sortMode = this._sortMode;

    const allTasks = await this.repository.getByFiscalYear(fiscalYear);
    if (requestId !== this._loadRequestId) {
      return;
    }

    const nextResult = await this.fetchStateAndCounts(
      allTasks,
      fiscalYear,
      labelId,
      quickAccess,
      searchKeyword,
      sortMode,
    );
    if (requestId !== this._loadRequestId) {
      return;
    }

    this._tasks = allTasks;
    this._state = nextResult.state;
    this._quickAccessTaskCounts = nextResult.quickAccessTaskCounts;
    this._taskIssueCounts = nextResult.taskIssueCounts;
    this.notify();
  }

  /**
   * フィルタ済みタスク一覧および各種集計件数を取得する
   */
  private async fetchStateAndCounts(
    allTasks: readonly TaskRecord[],
    fiscalYear: number,
    labelId: number | undefined,
    quickAccess: Partial<QuickAccessRecord> | undefined,
    searchKeyword: string,
    sortMode: TaskSortMode,
  ): Promise<{
    state: readonly TaskRecord[];
    quickAccessTaskCounts: QuickAccessTaskCounts;
    taskIssueCounts: Map<number, TaskIssueCount>;
  }> {
    if (!this._query) {
      return {
        state: this.filterTasksInMemory(
          allTasks,
          labelId,
          quickAccess,
          searchKeyword,
          sortMode,
        ),
        quickAccessTaskCounts: calculateQuickAccessTaskCounts(allTasks),
        taskIssueCounts: new Map(),
      };
    }

    const [state, quickAccessTaskCounts, taskIssueCounts] = await Promise.all([
      this._query.getFilteredTasks({
        fiscalYear,
        labelId,
        quickAccess,
        searchKeyword,
        sortMode,
      }),
      this._query.getQuickAccessTaskCounts(fiscalYear),
      this._query.getTaskIssueCounts(fiscalYear),
    ]);

    return { state, quickAccessTaskCounts, taskIssueCounts };
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
  private filterTasksInMemory(
    tasks: readonly TaskRecord[],
    labelId: number | undefined = this._labelId,
    quickAccess: Partial<QuickAccessRecord> | undefined = this._quickAccess,
    searchKeyword: string = this._searchKeyword,
    sortMode: TaskSortMode = this._sortMode,
  ): readonly TaskRecord[] {
    let filtered = [...tasks];
    const term = searchKeyword.trim().toLowerCase();

    if (term !== "") {
      filtered = filtered.filter((t) => matchesTaskKeyword(t, term));
    }

    if (labelId !== undefined) {
      filtered = filtered.filter((t) => t.labelId === labelId);
    }

    if (quickAccess) {
      filtered = applyQuickAccessFilter(filtered, quickAccess);
    }

    return sortTasks(filtered, sortMode);
  }

  /**
   * ソートモードを設定・永続化し、タスク一覧を再読み込みする。
   * 現在と同一のモードが指定された場合は処理をスキップする。
   *
   * @param {TaskSortMode} mode 変更後のソートモード
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public setSortMode = async (mode: TaskSortMode): Promise<void> => {
    const normalized = normalizeTaskSortMode(mode);
    if (this._sortMode === normalized) {
      return;
    }
    this._sortMode = normalized;
    this.saveSortMode(normalized);
    await this.loadState();
  };

  /**
   * ソートモードを「期限日昇順（dueDate）」と「タスク名昇順（name）」でトグル切替する。
   *
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public toggleSortMode = async (): Promise<void> => {
    const nextMode: TaskSortMode =
      this._sortMode === "dueDate" ? "name" : "dueDate";
    await this.setSortMode(nextMode);
  };

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

