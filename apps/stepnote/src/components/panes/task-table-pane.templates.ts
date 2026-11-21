import { html, nothing, type HTMLTemplateResult } from "lit";
import { live } from "lit/directives/live.js";
import { format } from "@shared/utils";
import type {
  DatePickerChangeEventDetail,
  SearchInputEventDetail,
} from "@shared/components";
import {
  TASK_STATUS_ICON_MAP,
  TASK_STATUS_LIST,
  TASK_STATUS_MAP,
  TASK_STATUS_TYPE_MAP,
} from "@/constants/task-status.constants.js";
import type { LabelRecord } from "@/db/models/navigation.model";
import type { TagRecord } from "@/db/models/tag.model";
import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type {
  TaskTableFilterState,
  TaskTableRowViewModel,
  TaskTableSortKey,
  TaskTableSortState,
} from "@/types";
import {
  formatContactsSummary,
  formatContactsTooltip,
} from "@/utils/task-table.utils.js";

/** TaskTablePane テンプレート描画用パラメーター */
export interface TaskTableTemplatesParams {
  rows: readonly TaskTableRowViewModel[];
  labels: readonly LabelRecord[];
  tags: readonly TagRecord[];
  availableFiscalYears: readonly number[];
  filter: Readonly<TaskTableFilterState>;
  sort: Readonly<TaskTableSortState>;
  selectedIds: ReadonlySet<number>;
  selectedCount: number;
  isAllFilteredSelected: boolean;
  isSomeFilteredSelected: boolean;
  hasLabels: boolean;
  onCreateTask: () => void;
  onKeywordInput: (e: CustomEvent<SearchInputEventDetail>) => void;
  onFiscalYearSelectChange: (e: Event) => void;
  onStatusToggle: (statusCode: TaskStatusCode) => void;
  onLabelSelectChange: (e: Event) => void;
  onTagSelectChange: (e: Event) => void;
  onDueSelectChange: (e: Event) => void;
  onResetFilters: () => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onSortClick: (key: TaskTableSortKey) => void;
  onToggleRowSelect: (taskId: number) => void;
  onBookmarkClick: (e: MouseEvent, taskId: number) => void;
  onOpenTask: (taskId: number) => void;
  onRowStatusUpdate: (taskId: number, statusCode: TaskStatusCode) => void;
  onRowLabelUpdate: (taskId: number, labelId: number) => void;
  onRowDueDateUpdate: (taskId: number, date: Date | null) => void;
  onRowTagsUpdate: (taskId: number, tagIds: number[]) => void;
}

interface SortableColumnDef {
  readonly key: TaskTableSortKey;
  readonly label: string;
  readonly className: string;
}

const PREFIX_SORT_COLUMNS: readonly SortableColumnDef[] = [
  { key: "id", label: "ID", className: "task-table-pane__th--id" },
  { key: "status", label: "状態", className: "task-table-pane__th--status" },
  { key: "label", label: "ラベル", className: "task-table-pane__th--label" },
  { key: "name", label: "タスク名", className: "task-table-pane__th--name" },
  { key: "dueDate", label: "期限日", className: "task-table-pane__th--due" },
];

/**
 * ヘッダーバー（タイトル＋新規タスク作成ボタン）を描画する。
 */
export function renderTaskTableHeader(
  params: Pick<TaskTableTemplatesParams, "rows" | "hasLabels" | "onCreateTask">,
): HTMLTemplateResult {
  const createTooltip = params.hasLabels
    ? "新規タスクを作成 (Alt+N)"
    : "ラベルを登録してください";

  return html`
    <div class="task-table-pane__header">
      <div class="task-table-pane__header-left">
        <span class="task-table-pane__title">タスク一覧</span>
        <span class="task-table-pane__count">${params.rows.length}件</span>
      </div>
      <div class="task-table-pane__header-right">
        <wa-tooltip for="task-table-create-btn" trigger="hover">
          ${createTooltip}
        </wa-tooltip>
        <wa-button
          id="task-table-create-btn"
          class="task-table-pane__create-btn"
          variant="brand"
          appearance="outlined"
          size="s"
          ?disabled=${!params.hasLabels}
          @click=${params.onCreateTask}
        >
          <wa-icon
            slot="start"
            library="my-icons"
            name="plus-solid-full"
          ></wa-icon>
          新規タスク
        </wa-button>
      </div>
    </div>
  `;
}

function renderStatusFilterTriggerContent(
  statusCodes: readonly TaskStatusCode[],
): HTMLTemplateResult {
  if (statusCodes.length === 0) {
    return html`
      <span
        class="task-table-pane__filter-status-text task-table-pane__filter-status-text--empty"
      >
        状態: 未選択
      </span>
    `;
  }
  if (statusCodes.length === 1) {
    const code = statusCodes[0];
    return html`
      <wa-icon
        library="my-icons"
        name=${TASK_STATUS_ICON_MAP[code]}
        class="task-table-pane__status-icon type-${TASK_STATUS_TYPE_MAP[code]}"
      ></wa-icon>
      <span class="task-table-pane__filter-status-text">
        ${TASK_STATUS_MAP[code].labelJa}
      </span>
    `;
  }
  if (statusCodes.length === TASK_STATUS_LIST.length) {
    return html`
      <span class="task-table-pane__filter-status-text">状態: すべて</span>
    `;
  }
  const label = statusCodes
    .map((code) => TASK_STATUS_MAP[code].labelJa)
    .join("・");
  return html`
    <span class="task-table-pane__filter-status-text">${label}</span>
  `;
}

function renderStatusFilterOption(
  s: (typeof TASK_STATUS_LIST)[number],
  statusCodes: readonly TaskStatusCode[],
): HTMLTemplateResult {
  return html`
    <wa-dropdown-item
      value=${String(s.code)}
      type="checkbox"
      ?checked=${statusCodes.includes(s.code)}
    >
      <wa-icon
        slot="icon"
        library="my-icons"
        name=${TASK_STATUS_ICON_MAP[s.code]}
        class="task-table-pane__status-icon type-${
          TASK_STATUS_TYPE_MAP[s.code]
        }"
      ></wa-icon>
      ${s.labelJa}
    </wa-dropdown-item>
  `;
}

function renderStatusFilterDropdown(
  params: TaskTableTemplatesParams,
): HTMLTemplateResult {
  const { statusCodes } = params.filter;
  const titleText =
    statusCodes.length > 0
      ? statusCodes.map((c) => TASK_STATUS_MAP[c].labelJa).join("・")
      : "状態: 未選択";

  return html`
    <wa-dropdown
      class="task-table-pane__filter-dropdown task-table-pane__filter-status"
      placement="bottom-start"
      @wa-select=${(e: CustomEvent<{ item?: { value?: string } }>) => {
        e.preventDefault();
        const val = e.detail?.item?.value;
        if (val !== undefined) {
          params.onStatusToggle(Number(val) as TaskStatusCode);
        }
      }}
    >
      <wa-button
        slot="trigger"
        class="task-table-pane__filter-trigger"
        variant="neutral"
        appearance="outlined"
        size="s"
        with-caret
        aria-label="状態フィルタ"
        title=${titleText}
      >
        ${renderStatusFilterTriggerContent(statusCodes)}
      </wa-button>
      ${TASK_STATUS_LIST.map((s) => renderStatusFilterOption(s, statusCodes))}
    </wa-dropdown>
  `;
}

function renderDueFilterSelect(
  params: TaskTableTemplatesParams,
): HTMLTemplateResult {
  return html`
    <wa-select
      class="task-table-pane__filter-select task-table-pane__filter-due"
      size="s"
      .value=${params.filter.dueFilter}
      aria-label="期限状況フィルタ"
      @change=${params.onDueSelectChange}
    >
      <wa-option value="all">
        <wa-icon
          slot="start"
          library="my-icons"
          name="calendar-solid-full"
          class="task-table-pane__due-icon task-table-pane__due-icon--default"
        ></wa-icon>
        期限: すべて
      </wa-option>
      <wa-option value="overdue">
        <wa-icon
          slot="start"
          library="my-icons"
          name="fire-solid-full"
          class="task-table-pane__due-icon task-table-pane__due-icon--overdue"
        ></wa-icon>
        期限切れ
      </wa-option>
      <wa-option value="asap">
        <wa-icon
          slot="start"
          library="my-icons"
          name="triangle-exclamation-solid-full"
          class="task-table-pane__due-icon task-table-pane__due-icon--asap"
        ></wa-icon>
        期限当日
      </wa-option>
      <wa-option value="upcoming">
        <wa-icon
          slot="start"
          library="my-icons"
          name="calendar-solid-full"
          class="task-table-pane__due-icon task-table-pane__due-icon--upcoming"
        ></wa-icon>
        期限間近
      </wa-option>
    </wa-select>
  `;
}

function renderYearStatusDueFilters(
  params: TaskTableTemplatesParams,
): HTMLTemplateResult {
  return html`
    <wa-select
      class="task-table-pane__filter-select task-table-pane__filter-year"
      size="s"
      .value=${String(params.filter.fiscalYear)}
      aria-label="年度フィルタ"
      @change=${params.onFiscalYearSelectChange}
    >
      <wa-option value="all">全年度</wa-option>
      ${params.availableFiscalYears.map(
        (fy) => html`<wa-option value=${String(fy)}>${fy}年度</wa-option>`,
      )}
    </wa-select>

    ${renderStatusFilterDropdown(params)} ${renderDueFilterSelect(params)}
  `;
}

function renderLabelAndTagFilters(
  params: TaskTableTemplatesParams,
): HTMLTemplateResult {
  return html`
    <wa-select
      class="task-table-pane__filter-select task-table-pane__filter-label"
      size="s"
      .value=${String(params.filter.labelId)}
      aria-label="ラベルフィルタ"
      @change=${params.onLabelSelectChange}
    >
      <wa-option value="all">ラベル: すべて</wa-option>
      <wa-option value="uncategorized">未分類</wa-option>
      ${params.labels.map(
        (l) => html`<wa-option value=${String(l.id)}>${l.name}</wa-option>`,
      )}
    </wa-select>

    <wa-select
      class="task-table-pane__filter-select task-table-pane__filter-tag"
      size="s"
      .value=${String(params.filter.tagId)}
      aria-label="タグフィルタ"
      @change=${params.onTagSelectChange}
    >
      <wa-option value="all">タグ: すべて</wa-option>
      ${params.tags.map(
        (t) => html`<wa-option value=${String(t.id)}>${t.name}</wa-option>`,
      )}
    </wa-select>
  `;
}

/**
 * 複合フィルタバーを描画する。
 */
export function renderTaskTableFilters(
  params: TaskTableTemplatesParams,
): HTMLTemplateResult {
  return html`
    <div class="task-table-pane__filters">
      <search-input
        class="task-table-pane__filter-keyword"
        .value=${params.filter.keyword}
        placeholder="キーワード検索 (#タグ名 可)..."
        @search-input=${params.onKeywordInput}
      ></search-input>
      ${renderYearStatusDueFilters(params)} ${renderLabelAndTagFilters(params)}
      <wa-button
        class="task-table-pane__filter-reset"
        variant="neutral"
        appearance="plain"
        size="s"
        @click=${params.onResetFilters}
      >
        <wa-icon
          slot="start"
          library="my-icons"
          name="xmark-solid-full"
        ></wa-icon>
        リセット
      </wa-button>
    </div>
  `;
}

/**
 * 選択件数フィードバックバーを描画する（将来の一括操作ボタン配置枠）。
 */
export function renderSelectionFeedbackBar(
  params: Pick<TaskTableTemplatesParams, "selectedCount" | "onClearSelection">,
): HTMLTemplateResult | typeof nothing {
  if (params.selectedCount <= 0) {
    return nothing;
  }

  return html`
    <div class="task-table-pane__selection-bar">
      <span class="task-table-pane__selection-count">
        ${params.selectedCount}件選択中
      </span>
      <div class="task-table-pane__selection-actions">
        <wa-button
          class="task-table-pane__selection-clear"
          variant="neutral"
          appearance="plain"
          size="s"
          @click=${params.onClearSelection}
        >
          選択を解除
        </wa-button>
      </div>
    </div>
  `;
}

function renderSortHeaderButton(
  col: SortableColumnDef,
  sort: Readonly<TaskTableSortState>,
  onSortClick: (key: TaskTableSortKey) => void,
): HTMLTemplateResult {
  const isSorted = sort.key === col.key;
  const iconName = isSorted
    ? sort.direction === "asc"
      ? "angle-up-solid-full"
      : "angle-down-solid-full"
    : "arrows-up-down-solid-full";

  return html`
    <th class="task-table-pane__th ${col.className}">
      <button
        type="button"
        class="task-table-pane__sort-btn ${
          isSorted ? "task-table-pane__sort-btn--active" : ""
        }"
        @click=${() => onSortClick(col.key)}
      >
        <span>${col.label}</span>
        <wa-icon
          class="task-table-pane__sort-icon"
          library="my-icons"
          name=${iconName}
        ></wa-icon>
      </button>
    </th>
  `;
}

/**
 * テーブルヘッダー行（列順: チェックボックス | ID | 状態 | ラベル | タスク名 | 期限日 | 関係者 | タグ | Issue状態）を描画する。
 */
export function renderTaskTableHeaderRow(
  params: Pick<
    TaskTableTemplatesParams,
    | "sort"
    | "isAllFilteredSelected"
    | "isSomeFilteredSelected"
    | "onToggleSelectAll"
    | "onSortClick"
  >,
): HTMLTemplateResult {
  return html`
    <thead class="task-table-pane__thead">
      <tr class="task-table-pane__tr task-table-pane__tr--head">
        <th class="task-table-pane__th task-table-pane__th--select">
          <wa-checkbox
            class="task-table-pane__checkbox-all"
            aria-label="表示中のタスクをすべて選択"
            .checked=${live(params.isAllFilteredSelected)}
            .indeterminate=${params.isSomeFilteredSelected}
            @change=${params.onToggleSelectAll}
          ></wa-checkbox>
        </th>
        ${PREFIX_SORT_COLUMNS.map((col) =>
          renderSortHeaderButton(col, params.sort, params.onSortClick),
        )}
        <th class="task-table-pane__th task-table-pane__th--contacts">
          関係者
        </th>
        <th class="task-table-pane__th task-table-pane__th--tags">タグ</th>
        ${renderSortHeaderButton(
          {
            key: "issues",
            label: "Issue状態",
            className: "task-table-pane__th--issues",
          },
          params.sort,
          params.onSortClick,
        )}
      </tr>
    </thead>
  `;
}

function renderTaskNameCell(
  row: TaskTableRowViewModel,
  onBookmarkClick: (e: MouseEvent, taskId: number) => void,
  onOpenTask: (taskId: number) => void,
): HTMLTemplateResult {
  const taskId = row.task.id ?? 0;
  const isBookmarked = Boolean(row.task.bookmark);

  return html`
    <td class="task-table-pane__td task-table-pane__td--name">
      <div class="task-table-pane__name-cell">
        <button
          type="button"
          class="task-table-pane__bookmark-btn ${
            isBookmarked ? "task-table-pane__bookmark-btn--active" : ""
          }"
          aria-label=${isBookmarked ? "ブックマーク解除" : "ブックマーク追加"}
          title=${isBookmarked ? "ブックマーク解除" : "ブックマーク追加"}
          @click=${(e: MouseEvent) => onBookmarkClick(e, taskId)}
        >
          <wa-icon
            library="my-icons"
            name="bookmark-solid-full"
            class="task-table-pane__bookmark-icon"
          ></wa-icon>
        </button>
        <button
          type="button"
          class="task-table-pane__task-link"
          title=${row.task.name}
          @click=${() => onOpenTask(taskId)}
        >
          ${row.task.name}
        </button>
      </div>
    </td>
  `;
}

function renderTagCells(
  row: TaskTableRowViewModel,
  onRowTagsUpdate: (taskId: number, tagIds: number[]) => void,
): HTMLTemplateResult {
  const taskId = row.task.id ?? 0;

  return html`
    <td class="task-table-pane__td task-table-pane__td--tags">
      <task-tag-bar
        class="task-table-pane__tag-bar"
        ?compact=${true}
        .targetTaskId=${taskId}
        .targetTagIds=${row.task.tagIds ?? []}
        @task-tag-ids-change=${(
          e: CustomEvent<{ taskId: number; tagIds: number[] }>,
        ) => {
          onRowTagsUpdate(taskId, e.detail?.tagIds ?? []);
        }}
      ></task-tag-bar>
    </td>
  `;
}

function renderStatusDropdownItem(
  s: (typeof TASK_STATUS_LIST)[number],
  statusCode: TaskStatusCode,
  canComplete: boolean,
): HTMLTemplateResult {
  const isDisabled = s.code === 9 && !canComplete;
  return html`
    <wa-dropdown-item
      value=${String(s.code)}
      type="checkbox"
      ?checked=${s.code === statusCode}
      ?disabled=${isDisabled}
    >
      <wa-icon
        slot="icon"
        library="my-icons"
        name=${TASK_STATUS_ICON_MAP[s.code]}
        class="task-table-pane__status-icon type-${TASK_STATUS_TYPE_MAP[s.code]}"
      ></wa-icon>
      ${s.labelJa}
    </wa-dropdown-item>
  `;
}

function renderTaskStatusCell(
  row: TaskTableRowViewModel,
  onRowStatusUpdate: (taskId: number, statusCode: TaskStatusCode) => void,
): HTMLTemplateResult {
  const taskId = row.task.id ?? 0;
  const statusCode = row.task.statusCode;
  const statusDef = TASK_STATUS_MAP[statusCode];
  const canComplete = row.issuesDone >= row.issuesTotal;

  return html`
    <td class="task-table-pane__td task-table-pane__td--status">
      <wa-dropdown
        class="task-table-pane__status-dropdown"
        placement="bottom-start"
        @wa-select=${(e: CustomEvent<{ item?: { value?: string } }>) => {
          const val = e.detail?.item?.value;
          if (val !== undefined) {
            onRowStatusUpdate(taskId, Number(val) as TaskStatusCode);
          }
        }}
      >
        <wa-button
          slot="trigger"
          class="task-table-pane__cell-trigger task-table-pane__status-btn"
          variant="neutral"
          appearance="plain"
          size="s"
          with-caret
        >
          <wa-icon
            slot="start"
            library="my-icons"
            name=${TASK_STATUS_ICON_MAP[statusCode]}
            class="task-table-pane__status-icon type-${TASK_STATUS_TYPE_MAP[statusCode]}"
          ></wa-icon>
          <span>${statusDef.labelJa}</span>
        </wa-button>
        ${TASK_STATUS_LIST.map((s) =>
          renderStatusDropdownItem(s, statusCode, canComplete),
        )}
      </wa-dropdown>
    </td>
  `;
}

function renderTaskLabelCell(
  row: TaskTableRowViewModel,
  labels: readonly LabelRecord[],
  onRowLabelUpdate: (taskId: number, labelId: number) => void,
): HTMLTemplateResult {
  const taskId = row.task.id ?? 0;
  const labelText = row.labelName.trim() || "未分類";

  return html`
    <td class="task-table-pane__td task-table-pane__td--label">
      <wa-dropdown
        class="task-table-pane__label-dropdown"
        placement="bottom-start"
        @wa-select=${(e: CustomEvent<{ item?: { value?: string } }>) => {
          const val = e.detail?.item?.value;
          if (val !== undefined) {
            const nextId = Number(val);
            if (!Number.isNaN(nextId)) {
              onRowLabelUpdate(taskId, nextId);
            }
          }
        }}
      >
        <wa-button
          slot="trigger"
          class="task-table-pane__cell-trigger task-table-pane__label-btn"
          variant="neutral"
          appearance="plain"
          size="s"
          with-caret
          title=${labelText}
        >
          <span class="task-table-pane__label-text">${labelText}</span>
        </wa-button>
        ${labels.map(
          (l) => html`
            <wa-dropdown-item
              value=${String(l.id)}
              type="checkbox"
              ?checked=${l.id === row.task.labelId}
            >
              ${l.name}
            </wa-dropdown-item>
          `,
        )}
      </wa-dropdown>
    </td>
  `;
}

function renderTaskDueCell(
  row: TaskTableRowViewModel,
  onRowDueDateUpdate: (taskId: number, date: Date | null) => void,
): HTMLTemplateResult {
  const taskId = row.task.id ?? 0;
  const formattedDueDate = row.task.dueDate
    ? format(new Date(row.task.dueDate), "yyyy-MM-dd")
    : "";
  const iconName = row.taskDueInfo?.icon ?? "calendar-solid-full";
  const statusClass = row.taskDueInfo
    ? `task-table-pane__due-input--${row.taskDueInfo.status}`
    : "";

  return html`
    <td class="task-table-pane__td task-table-pane__td--due">
      <datepicker-input
        class="task-table-pane__due-input ${statusClass}"
        size="s"
        icon=${iconName}
        .value=${formattedDueDate}
        @datepicker-change=${(e: CustomEvent<DatePickerChangeEventDetail>) => {
          onRowDueDateUpdate(taskId, e.detail?.date ?? null);
        }}
      ></datepicker-input>
    </td>
  `;
}

function renderIssueStatusCell(row: TaskTableRowViewModel): HTMLTemplateResult {
  return html`
    <td class="task-table-pane__td task-table-pane__td--issues">
      <span class="task-table-pane__issues-cell">
        ${
          row.issuesDueInfo
            ? html`<wa-icon
                library="my-icons"
                name=${row.issuesDueInfo.icon}
                class="task-table-pane__due-icon task-table-pane__due-icon--${row.issuesDueInfo.status}"
              ></wa-icon>`
            : null
        }
        <span>${row.issuesDone}/${row.issuesTotal}</span>
      </span>
    </td>
  `;
}

/**
 * テーブルの1行を描画する。
 */
export function renderTaskTableRow(
  row: TaskTableRowViewModel,
  params: Pick<
    TaskTableTemplatesParams,
    | "labels"
    | "selectedIds"
    | "onToggleRowSelect"
    | "onBookmarkClick"
    | "onOpenTask"
    | "onRowStatusUpdate"
    | "onRowLabelUpdate"
    | "onRowDueDateUpdate"
    | "onRowTagsUpdate"
  >,
): HTMLTemplateResult {
  const taskId = row.task.id ?? 0;
  const isSelected = params.selectedIds.has(taskId);
  const contactText = formatContactsSummary(row.task.contacts);
  const contactTooltip = formatContactsTooltip(row.task.contacts);

  return html`
    <tr
      class="task-table-pane__tr ${
        isSelected ? "task-table-pane__tr--selected" : ""
      }"
    >
      <td class="task-table-pane__td task-table-pane__td--select">
        <wa-checkbox
          class="task-table-pane__checkbox-row"
          aria-label="タスク #${taskId} を選択"
          .checked=${live(isSelected)}
          @change=${() => params.onToggleRowSelect(taskId)}
        ></wa-checkbox>
      </td>
      <td class="task-table-pane__td task-table-pane__td--id">#${taskId}</td>
      ${renderTaskStatusCell(row, params.onRowStatusUpdate)}
      ${renderTaskLabelCell(row, params.labels, params.onRowLabelUpdate)}
      ${renderTaskNameCell(row, params.onBookmarkClick, params.onOpenTask)}
      ${renderTaskDueCell(row, params.onRowDueDateUpdate)}
      <td
        class="task-table-pane__td task-table-pane__td--contacts"
        title=${contactTooltip || nothing}
      >
        ${contactText}
      </td>
      ${renderTagCells(row, params.onRowTagsUpdate)}
      ${renderIssueStatusCell(row)}
    </tr>
  `;
}
