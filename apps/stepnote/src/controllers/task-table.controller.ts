import type { ReactiveControllerHost } from "lit";
import type { TaskRecord } from "@/db/models/task.model";
import type { LabelRecord } from "@/db/models/navigation.model";
import type { TagRecord } from "@/db/models/tag.model";
import type { TaskListQuery } from "@/db/queries/task-list.query";
import type { TaskRepository } from "@/repositories/task.repository";
import type { IssuesRepository } from "@/repositories/issues.repository";
import type { LabelsRepository } from "@/repositories/labels.repository";
import type { TagsRepository } from "@/repositories/tags.repository";
import type { SystemLogService } from "@/services/system-log.service";
import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type {
  TaskTableDueFilter,
  TaskTableFilterState,
  TaskTableRowViewModel,
  TaskTableSortKey,
  TaskTableSortState,
} from "@/types/view/task-table-view.type";
import { normalizeTagIds } from "@/utils/tag.utils.js";
import {
  buildTaskTableRows,
  DEFAULT_TASK_TABLE_SORT,
  DEFAULT_TASK_TABLE_STATUS_CODES,
  extractAvailableFiscalYears,
  filterTaskTableRows,
  normalizeTaskTableFiscalYear,
  normalizeTaskTableSortState,
  sortTaskTableRows,
  toggleStatusCodeFilter,
} from "@/utils/task-table.utils.js";
import { BaseReactiveController } from "./base-reactive.controller.js";

/** ストレージ互換インターフェース */
export interface TaskTableStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** TaskTableController 依存オブジェクト */
export interface TaskTableControllerDeps {
  taskRepository: TaskRepository;
  issuesRepository: IssuesRepository;
  labelsRepository: LabelsRepository;
  tagsRepository: TagsRepository;
  taskListQuery?: TaskListQuery;
  storage?: TaskTableStorage;
  fiscalYearStorageKey?: string;
  sortStorageKey?: string;
  systemLogService?: SystemLogService;
  onTaskMutated?: (taskId: number) => Promise<void> | void;
}

const DEFAULT_FISCAL_YEAR_STORAGE_KEY = "stepnote_task_table_fiscal_year";
const DEFAULT_SORT_STORAGE_KEY = "stepnote_task_table_sort";

const createDefaultFilter = (
  fiscalYear: number | "all",
): TaskTableFilterState => ({
  fiscalYear,
  keyword: "",
  statusCodes: [...DEFAULT_TASK_TABLE_STATUS_CODES],
  labelId: "all",
  tagId: "all",
  dueFilter: "all",
});

/**
 * 一覧モードにおけるタスク全件データ・複合フィルタ・ソート・複数行選択状態を管理する Reactive Controller
 */
export class TaskTableController extends BaseReactiveController<void> {
  private readonly deps: TaskTableControllerDeps;
  private readonly storage?: TaskTableStorage;
  private readonly fiscalYearStorageKey: string;
  private readonly sortStorageKey: string;

  private _allRows: TaskTableRowViewModel[] = [];
  private _rows: TaskTableRowViewModel[] = [];
  private _allTasks: TaskRecord[] = [];
  private _labels: LabelRecord[] = [];
  private _tags: TagRecord[] = [];
  private _availableFiscalYears: number[] = [];
  private _filter: TaskTableFilterState;
  private _sort: TaskTableSortState;
  private _selectedIds: Set<number> = new Set();
  private _matchedKeywordTaskIds?: Set<number>;
  private _loadRequestId = 0;

  public get rows(): readonly TaskTableRowViewModel[] {
    return this._rows;
  }

  public get allTasks(): readonly TaskRecord[] {
    return this._allTasks;
  }

  public get labels(): readonly LabelRecord[] {
    return this._labels;
  }

  public get tags(): readonly TagRecord[] {
    return this._tags;
  }

  public get availableFiscalYears(): readonly number[] {
    return this._availableFiscalYears;
  }

  public get filter(): Readonly<TaskTableFilterState> {
    return this._filter;
  }

  public get sort(): Readonly<TaskTableSortState> {
    return this._sort;
  }

  public get selectedIds(): ReadonlySet<number> {
    return this._selectedIds;
  }

  public get selectedCount(): number {
    return this._selectedIds.size;
  }

  public get isAllFilteredSelected(): boolean {
    const selectableIds = this.getFilteredSelectableIds();
    return (
      selectableIds.length > 0 &&
      selectableIds.every((id) => this._selectedIds.has(id))
    );
  }

  public get isSomeFilteredSelected(): boolean {
    const selectableIds = this.getFilteredSelectableIds();
    if (selectableIds.length === 0) return false;
    const selectedInView = selectableIds.filter((id) =>
      this._selectedIds.has(id),
    ).length;
    return selectedInView > 0 && selectedInView < selectableIds.length;
  }

  constructor(host: ReactiveControllerHost, deps: TaskTableControllerDeps) {
    super(host);
    this.deps = deps;
    this.fiscalYearStorageKey =
      deps.fiscalYearStorageKey ?? DEFAULT_FISCAL_YEAR_STORAGE_KEY;
    this.sortStorageKey = deps.sortStorageKey ?? DEFAULT_SORT_STORAGE_KEY;
    this.storage =
      deps.storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);

    const savedYear = normalizeTaskTableFiscalYear(
      this.storage?.getItem(this.fiscalYearStorageKey),
    );
    const savedSort = normalizeTaskTableSortState(
      this.storage?.getItem(this.sortStorageKey),
    );

    this._filter = createDefaultFilter(savedYear);
    this._sort = savedSort ?? { ...DEFAULT_TASK_TABLE_SORT };
    this._availableFiscalYears = extractAvailableFiscalYears([]);
  }

  private getFilteredSelectableIds(): number[] {
    return this._rows
      .map((row) => row.task.id)
      .filter((id): id is number => id !== undefined);
  }

  private recomputeRows(): void {
    const filtered = filterTaskTableRows(
      this._allRows,
      this._filter,
      this._matchedKeywordTaskIds,
    );
    this._rows = sortTaskTableRows(filtered, this._sort);
  }

  private applyFilterChange(
    updates: Partial<TaskTableFilterState>,
    persistYear: boolean = false,
  ): void {
    this._filter = { ...this._filter, ...updates };
    if (persistYear) {
      this.storage?.setItem(
        this.fiscalYearStorageKey,
        String(this._filter.fiscalYear),
      );
    }
    this._selectedIds.clear();
    this.recomputeRows();
    this.notify();
  }

  /**
   * 全タスクおよび関連マスタ（Issue, Label, Tag）を再取得し、一覧行を更新する。
   */
  public refresh = async (): Promise<void> => {
    const requestId = ++this._loadRequestId;
    const [tasks, issues, labels, tags] = await Promise.all([
      this.deps.taskRepository.getAll(),
      this.deps.issuesRepository.getAll(),
      this.deps.labelsRepository.getAll(),
      this.deps.tagsRepository.getAll(),
    ]);

    if (requestId !== this._loadRequestId) return;

    const trimmedKeyword = this._filter.keyword.trim();
    const matchedIds =
      trimmedKeyword && this.deps.taskListQuery
        ? await this.deps.taskListQuery.searchTaskIds(trimmedKeyword)
        : undefined;

    if (requestId !== this._loadRequestId) return;

    this._allTasks = tasks;
    this._labels = labels;
    this._tags = tags;
    this._matchedKeywordTaskIds = matchedIds;
    this._availableFiscalYears = extractAvailableFiscalYears(tasks);
    this._allRows = buildTaskTableRows({ tasks, issues, labels, tags });
    this.recomputeRows();
    this.notify();
  };

  /**
   * 会計年度フィルタを変更し、選択状態をリセットして永続化する。
   */
  public setFiscalYearFilter = async (
    fiscalYear: number | "all",
  ): Promise<void> => {
    if (this._filter.fiscalYear === fiscalYear) return;
    this.applyFilterChange({ fiscalYear }, true);
  };

  /**
   * 横断検索キーワードフィルタを変更し、選択状態をリセットする。
   */
  public setKeywordFilter = async (keyword: string): Promise<void> => {
    const trimmed = keyword.trim();
    if (!trimmed || !this.deps.taskListQuery) {
      this._matchedKeywordTaskIds = undefined;
    } else {
      this._matchedKeywordTaskIds =
        await this.deps.taskListQuery.searchTaskIds(trimmed);
    }
    this.applyFilterChange({ keyword });
  };

  public setStatusFilters = (statusCodes: readonly TaskStatusCode[]): void => {
    const unique = Array.from(new Set(statusCodes));
    this.applyFilterChange({ statusCodes: unique });
  };

  public toggleStatusFilter = (statusCode: TaskStatusCode): void => {
    const next = toggleStatusCodeFilter(this._filter.statusCodes, statusCode);
    this.applyFilterChange({ statusCodes: next });
  };

  public setLabelFilter = (labelId: number | "all" | "uncategorized"): void => {
    if (this._filter.labelId === labelId) return;
    this.applyFilterChange({ labelId });
  };

  public setTagFilter = (tagId: number | "all"): void => {
    if (this._filter.tagId === tagId) return;
    this.applyFilterChange({ tagId });
  };

  public setDueFilter = (dueFilter: TaskTableDueFilter): void => {
    if (this._filter.dueFilter === dueFilter) return;
    this.applyFilterChange({ dueFilter });
  };

  /**
   * 会計年度以外のフィルタ条件を初期状態に戻し、選択状態をリセットする。
   */
  public resetFilters = async (): Promise<void> => {
    this._matchedKeywordTaskIds = undefined;
    this.applyFilterChange({
      keyword: "",
      statusCodes: [...DEFAULT_TASK_TABLE_STATUS_CODES],
      labelId: "all",
      tagId: "all",
      dueFilter: "all",
    });
  };

  /**
   * 列ソートを切り替え、ソート設定を永続化する。
   */
  public toggleSort = (key: TaskTableSortKey): void => {
    const nextDirection =
      this._sort.key === key && this._sort.direction === "asc" ? "desc" : "asc";
    this._sort = { key, direction: nextDirection };
    this.storage?.setItem(this.sortStorageKey, JSON.stringify(this._sort));
    this.recomputeRows();
    this.notify();
  };

  /**
   * 指定タスクの行選択チェックボックスを切り替える。
   */
  public toggleRowSelection = (taskId: number): void => {
    if (this._selectedIds.has(taskId)) {
      this._selectedIds.delete(taskId);
    } else {
      this._selectedIds.add(taskId);
    }
    this.notify();
  };

  /**
   * 現在フィルタ結果として表示中の全行を一括選択または一括解除する。
   */
  public toggleSelectAllFiltered = (): void => {
    const selectableIds = this.getFilteredSelectableIds();
    if (selectableIds.length === 0) return;

    if (this.isAllFilteredSelected) {
      for (const id of selectableIds) {
        this._selectedIds.delete(id);
      }
    } else {
      for (const id of selectableIds) {
        this._selectedIds.add(id);
      }
    }
    this.notify();
  };

  /**
   * 行の選択状態をすべて解除する。
   */
  public clearSelection = (): void => {
    if (this._selectedIds.size === 0) return;
    this._selectedIds.clear();
    this.notify();
  };

  private resolveLabelName(labelId: number): string {
    const found = this._labels.find((l) => l.id === labelId);
    return found?.name ?? `ラベル ${labelId}`;
  }

  private async applyTaskMutation(
    taskId: number,
    partial: Partial<Omit<TaskRecord, "id">>,
    recordLog?: (before: TaskRecord) => Promise<void>,
  ): Promise<void> {
    const before = this._allTasks.find((t) => t.id === taskId);
    if (!before) return;

    await this.deps.taskRepository.update(taskId, {
      ...partial,
      updatedAt: partial.updatedAt ?? new Date(),
    });
    if (recordLog) {
      await recordLog(before);
    }
    await this.refresh();
    await this.deps.onTaskMutated?.(taskId);
  }

  /**
   * 指定タスクのブックマーク状態を反転し、一覧を最新化する。
   */
  public toggleBookmark = async (taskId: number): Promise<void> => {
    const target = this._allTasks.find((t) => t.id === taskId);
    if (!target) return;
    await this.deps.taskRepository.update(taskId, {
      bookmark: !target.bookmark,
    });
    await this.refresh();
    await this.deps.onTaskMutated?.(taskId);
  };

  /**
   * 指定タスクのステータスを更新する（未完了 Issue がある場合の完了をガード）。
   */
  public updateTaskStatus = async (
    taskId: number,
    statusCode: TaskStatusCode,
  ): Promise<void> => {
    const target = this._allTasks.find((t) => t.id === taskId);
    if (!target || target.statusCode === statusCode) return;

    if (statusCode === 9) {
      const issues = await this.deps.issuesRepository.getByTaskId(taskId);
      if (issues.some((issue) => issue.statusCode !== 9)) return;
    }

    await this.applyTaskMutation(taskId, { statusCode }, async (before) => {
      await this.deps.systemLogService?.logTaskStatusChanged(
        taskId,
        before.statusCode,
        statusCode,
      );
    });
  };

  /**
   * 指定タスクの所属ラベルを更新する。
   */
  public updateTaskLabel = async (
    taskId: number,
    labelId: number,
  ): Promise<void> => {
    const target = this._allTasks.find((t) => t.id === taskId);
    if (!target || target.labelId === labelId) return;

    await this.applyTaskMutation(taskId, { labelId }, async (before) => {
      const beforeLabel = this.resolveLabelName(before.labelId);
      const afterLabel = this.resolveLabelName(labelId);
      await this.deps.systemLogService?.logTaskLabelChanged(
        taskId,
        beforeLabel,
        afterLabel,
        before.labelId,
        labelId,
      );
    });
  };

  /**
   * 指定タスクの期限日を更新する。
   */
  public updateTaskDueDate = async (
    taskId: number,
    dueDate: Date,
  ): Promise<void> => {
    const target = this._allTasks.find((t) => t.id === taskId);
    if (!target) return;

    const beforeTime = new Date(target.dueDate).getTime();
    if (beforeTime === dueDate.getTime()) return;

    await this.applyTaskMutation(taskId, { dueDate }, async (before) => {
      await this.deps.systemLogService?.logTaskDueDateChanged(
        taskId,
        new Date(before.dueDate),
        dueDate,
      );
    });
  };

  /**
   * 指定タスクのタグID一覧を更新する。
   */
  public updateTaskTags = async (
    taskId: number,
    tagIds: readonly number[],
  ): Promise<void> => {
    const target = this._allTasks.find((t) => t.id === taskId);
    if (!target) return;

    const prevIds = normalizeTagIds(target.tagIds);
    const nextIds = normalizeTagIds(tagIds);
    const isUnchanged =
      prevIds.length === nextIds.length &&
      prevIds.every((id, idx) => id === nextIds[idx]);
    if (isUnchanged) return;

    await this.applyTaskMutation(taskId, { tagIds: nextIds });
  };
}
