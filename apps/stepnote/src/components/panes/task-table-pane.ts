import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@shared/components";
import { dispatchCustomEvent } from "@shared/utils";
import type { SearchInputEventDetail } from "@shared/components";
import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type { TaskTableDueFilter, TaskTableSortKey } from "@/types";
import {
  SubscriberElement,
  WithLabelsController,
  WithTaskTableController,
} from "@/utils/controller-consumers.mixin.js";
import {
  renderSelectionFeedbackBar,
  renderTaskTableFilters,
  renderTaskTableHeader,
  renderTaskTableHeaderRow,
  renderTaskTableRow,
  type TaskTableTemplatesParams,
} from "./task-table-pane.templates.js";
import styles from "./task-table-pane.scss?inline";

/**
 * タスク一覧表示ペインコンポーネント (TaskTablePane)
 *
 * 一覧モード時（詳細未選択時）に Menu ペインの右側全幅へ表示され、
 * 複合フィルタ・列ソート・チェックボックス選択・タスク詳細遷移を提供する。
 */
@customElement("task-table-pane")
export class TaskTablePane extends WithLabelsController(
  WithTaskTableController(SubscriberElement),
) {
  public static override styles = unsafeCSS(styles);

  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  override connectedCallback(): void {
    super.connectedCallback();
    void this.taskTableController?.refresh();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.subscriber.unsubscribeAll();
  }

  private get hasLabels(): boolean {
    if (this.labelsController) {
      return (
        this.labelsController.hasLabels ??
        (this.labelsController.state?.length ?? 0) > 0
      );
    }
    return (this.taskTableController?.labels.length ?? 0) > 0;
  }

  public handleCreateTask = (): void => {
    if (!this.hasLabels) return;
    dispatchCustomEvent(this, "request-task-create");
  };

  public handleFiscalYearChange = async (value: string): Promise<void> => {
    const next = value === "all" ? "all" : Number(value);
    if (next !== "all" && Number.isNaN(next)) return;
    await this.taskTableController?.setFiscalYearFilter(next);
  };

  public handleKeywordChange = async (keyword: string): Promise<void> => {
    await this.taskTableController?.setKeywordFilter(keyword);
  };

  public handleStatusChange = (value: string): void => {
    const next: TaskStatusCode | "all" =
      value === "all" ? "all" : (Number(value) as TaskStatusCode);
    this.taskTableController?.setStatusFilter(next);
  };

  public handleLabelChange = (value: string): void => {
    if (value === "all" || value === "uncategorized") {
      this.taskTableController?.setLabelFilter(value);
      return;
    }
    const num = Number(value);
    if (!Number.isNaN(num)) {
      this.taskTableController?.setLabelFilter(num);
    }
  };

  public handleTagChange = (value: string): void => {
    const next = value === "all" ? "all" : Number(value);
    if (next !== "all" && Number.isNaN(next)) return;
    this.taskTableController?.setTagFilter(next);
  };

  public handleDueChange = (value: string): void => {
    this.taskTableController?.setDueFilter(value as TaskTableDueFilter);
  };

  public handleResetFilters = async (): Promise<void> => {
    await this.taskTableController?.resetFilters();
  };

  public handleToggleSelectAll = (): void => {
    this.taskTableController?.toggleSelectAllFiltered();
  };

  public handleToggleRowSelect = (taskId: number): void => {
    this.taskTableController?.toggleRowSelection(taskId);
  };

  public handleClearSelection = (): void => {
    this.taskTableController?.clearSelection();
  };

  public handleSortClick = (key: TaskTableSortKey): void => {
    this.taskTableController?.toggleSort(key);
  };

  public handleBookmarkClick = async (
    event: MouseEvent,
    taskId: number,
  ): Promise<void> => {
    event.stopPropagation();
    await this.taskTableController?.toggleBookmark(taskId);
  };

  public handleOpenTask = (taskId: number): void => {
    this.taskTableController?.clearSelection();
    dispatchCustomEvent(this, "task-table-open-task", {
      detail: { taskId },
    });
  };

  private readSelectValue(event: Event): string {
    const target = event.target as HTMLElement & { value?: string };
    return target?.value ?? "";
  }

  private buildEventCallbacks() {
    return {
      onCreateTask: this.handleCreateTask,
      onKeywordInput: (e: CustomEvent<SearchInputEventDetail>) => {
        void this.handleKeywordChange(e.detail?.keyword ?? "");
      },
      onFiscalYearSelectChange: (e: Event) => {
        void this.handleFiscalYearChange(this.readSelectValue(e));
      },
      onStatusSelectChange: (e: Event) => {
        this.handleStatusChange(this.readSelectValue(e));
      },
      onLabelSelectChange: (e: Event) => {
        this.handleLabelChange(this.readSelectValue(e));
      },
      onTagSelectChange: (e: Event) => {
        this.handleTagChange(this.readSelectValue(e));
      },
      onDueSelectChange: (e: Event) => {
        this.handleDueChange(this.readSelectValue(e));
      },
      onResetFilters: () => {
        void this.handleResetFilters();
      },
      onToggleSelectAll: this.handleToggleSelectAll,
      onClearSelection: this.handleClearSelection,
      onSortClick: this.handleSortClick,
      onToggleRowSelect: (id: number) => {
        this.handleToggleRowSelect(id);
      },
      onBookmarkClick: (e: MouseEvent, id: number) => {
        void this.handleBookmarkClick(e, id);
      },
      onOpenTask: this.handleOpenTask,
    };
  }

  private buildTemplateParams(): TaskTableTemplatesParams {
    const ctrl = this.taskTableController;
    return {
      rows: ctrl?.rows ?? [],
      labels: ctrl?.labels ?? [],
      tags: ctrl?.tags ?? [],
      availableFiscalYears: ctrl?.availableFiscalYears ?? [],
      filter: ctrl?.filter ?? {
        fiscalYear: "all",
        keyword: "",
        statusCode: "all",
        labelId: "all",
        tagId: "all",
        dueFilter: "all",
      },
      sort: ctrl?.sort ?? { key: "dueDate", direction: "asc" },
      selectedIds: ctrl?.selectedIds ?? new Set<number>(),
      selectedCount: ctrl?.selectedCount ?? 0,
      isAllFilteredSelected: ctrl?.isAllFilteredSelected ?? false,
      isSomeFilteredSelected: ctrl?.isSomeFilteredSelected ?? false,
      hasLabels: this.hasLabels,
      ...this.buildEventCallbacks(),
    };
  }

  private renderTableBody(params: TaskTableTemplatesParams): HTMLTemplateResult {
    if (params.rows.length === 0) {
      return html`
        <div class="task-table-pane__empty">
          <span>該当するタスクがありません</span>
        </div>
      `;
    }

    return html`
      <div class="task-table-pane__table-wrapper">
        <table class="task-table-pane__table">
          ${renderTaskTableHeaderRow(params)}
          <tbody class="task-table-pane__tbody">
            ${params.rows.map((row) => renderTaskTableRow(row, params))}
          </tbody>
        </table>
      </div>
    `;
  }

  public override render(): HTMLTemplateResult {
    const params = this.buildTemplateParams();
    return html`
      <div class="task-table-pane">
        ${renderTaskTableHeader(params)}
        ${renderTaskTableFilters(params)}
        ${renderSelectionFeedbackBar(params)}
        ${this.renderTableBody(params)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-table-pane": TaskTablePane;
  }
}
