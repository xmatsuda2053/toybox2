import { html, nothing, type HTMLTemplateResult } from "lit";
import { format } from "@shared/utils";
import type { SearchInputEventDetail } from "@shared/components";
import {
  TASK_STATUS_ICON_MAP,
  TASK_STATUS_LIST,
  TASK_STATUS_MAP,
  TASK_STATUS_TYPE_MAP,
} from "@/constants/task-status.constants.js";
import type { LabelRecord } from "@/db/models/navigation.model";
import type { TagRecord } from "@/db/models/tag.model";
import type {
  TaskTableFilterState,
  TaskTableRowViewModel,
  TaskTableSortKey,
  TaskTableSortState,
} from "@/types";
import {
  resolveWaTagVariant,
  splitVisibleAndOverflowTags,
} from "@/utils/tag.utils.js";
import { formatContactsSummary } from "@/utils/task-table.utils.js";

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
  onStatusSelectChange: (e: Event) => void;
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
  params: Pick<
    TaskTableTemplatesParams,
    "rows" | "hasLabels" | "onCreateTask"
  >,
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

function renderYearAndStatusFilters(
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

    <wa-select
      class="task-table-pane__filter-select task-table-pane__filter-status"
      size="s"
      .value=${String(params.filter.statusCode)}
      aria-label="状態フィルタ"
      @change=${params.onStatusSelectChange}
    >
      <wa-option value="all">状態: すべて</wa-option>
      ${TASK_STATUS_LIST.map(
        (s) => html`<wa-option value=${String(s.code)}>${s.labelJa}</wa-option>`,
      )}
    </wa-select>
  `;
}

function renderLabelTagDueFilters(
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

    <wa-select
      class="task-table-pane__filter-select task-table-pane__filter-due"
      size="s"
      .value=${params.filter.dueFilter}
      aria-label="期限状況フィルタ"
      @change=${params.onDueSelectChange}
    >
      <wa-option value="all">期限: すべて</wa-option>
      <wa-option value="overdue">期限切れ</wa-option>
      <wa-option value="asap">期限当日</wa-option>
      <wa-option value="upcoming">期限間近</wa-option>
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
      ${renderYearAndStatusFilters(params)}
      ${renderLabelTagDueFilters(params)}
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
        class="task-table-pane__sort-btn ${isSorted
          ? "task-table-pane__sort-btn--active"
          : ""}"
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
            ?checked=${params.isAllFilteredSelected}
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
          class="task-table-pane__bookmark-btn ${isBookmarked
            ? "task-table-pane__bookmark-btn--active"
            : ""}"
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

function renderTagCells(tags: readonly TagRecord[]): HTMLTemplateResult {
  const { visibleTags, hiddenCount } = splitVisibleAndOverflowTags(tags);
  if (visibleTags.length === 0 && hiddenCount === 0) {
    return html`<td class="task-table-pane__td task-table-pane__td--tags">
      <span class="task-table-pane__muted">-</span>
    </td>`;
  }

  return html`
    <td class="task-table-pane__td task-table-pane__td--tags">
      <div class="task-table-pane__tags-cell">
        ${visibleTags.map(
          (tag) => html`
            <wa-tag
              class="task-table-pane__tag stepnote-tag stepnote-tag--${tag.variant}"
              size="xs"
              pill
              appearance="filled"
              variant=${resolveWaTagVariant(tag.variant)}
              title=${tag.description || tag.name}
            >
              ${tag.name}
            </wa-tag>
          `,
        )}
        ${hiddenCount > 0
          ? html`
              <wa-tag
                class="task-table-pane__tag-overflow stepnote-tag stepnote-tag--neutral"
                size="xs"
                pill
                appearance="filled"
                variant="neutral"
              >
                +${hiddenCount}
              </wa-tag>
            `
          : null}
      </div>
    </td>
  `;
}

function renderTaskStatusCell(statusCode: keyof typeof TASK_STATUS_MAP): HTMLTemplateResult {
  const statusDef = TASK_STATUS_MAP[statusCode];
  const iconName = TASK_STATUS_ICON_MAP[statusCode];
  const typeClass = TASK_STATUS_TYPE_MAP[statusCode];

  return html`
    <td class="task-table-pane__td task-table-pane__td--status">
      <span class="task-table-pane__status-cell">
        <wa-icon
          library="my-icons"
          name=${iconName}
          class="task-table-pane__status-icon type-${typeClass}"
        ></wa-icon>
        <span>${statusDef.labelJa}</span>
      </span>
    </td>
  `;
}

function renderTaskDueCell(row: TaskTableRowViewModel): HTMLTemplateResult {
  const dueDateStr = row.task.dueDate
    ? format(new Date(row.task.dueDate), "yyyy-MM-dd")
    : "-";

  return html`
    <td class="task-table-pane__td task-table-pane__td--due">
      <span class="task-table-pane__due-cell">
        ${row.taskDueInfo
          ? html`<wa-icon
              library="my-icons"
              name=${row.taskDueInfo.icon}
              class="task-table-pane__due-icon task-table-pane__due-icon--${row.taskDueInfo.status}"
            ></wa-icon>`
          : null}
        <span>${dueDateStr}</span>
      </span>
    </td>
  `;
}

function renderIssueStatusCell(row: TaskTableRowViewModel): HTMLTemplateResult {
  return html`
    <td class="task-table-pane__td task-table-pane__td--issues">
      <span class="task-table-pane__issues-cell">
        ${row.issuesDueInfo
          ? html`<wa-icon
              library="my-icons"
              name=${row.issuesDueInfo.icon}
              class="task-table-pane__due-icon task-table-pane__due-icon--${row.issuesDueInfo.status}"
            ></wa-icon>`
          : null}
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
    "selectedIds" | "onToggleRowSelect" | "onBookmarkClick" | "onOpenTask"
  >,
): HTMLTemplateResult {
  const taskId = row.task.id ?? 0;
  const isSelected = params.selectedIds.has(taskId);
  const labelText = row.labelName.trim() || "未分類";
  const contactText = formatContactsSummary(row.task.contacts);

  return html`
    <tr
      class="task-table-pane__tr ${isSelected
        ? "task-table-pane__tr--selected"
        : ""}"
    >
      <td class="task-table-pane__td task-table-pane__td--select">
        <wa-checkbox
          class="task-table-pane__checkbox-row"
          aria-label="タスク #${taskId} を選択"
          ?checked=${isSelected}
          @change=${() => params.onToggleRowSelect(taskId)}
        ></wa-checkbox>
      </td>
      <td class="task-table-pane__td task-table-pane__td--id">#${taskId}</td>
      ${renderTaskStatusCell(row.task.statusCode)}
      <td class="task-table-pane__td task-table-pane__td--label" title=${labelText}>
        ${labelText}
      </td>
      ${renderTaskNameCell(row, params.onBookmarkClick, params.onOpenTask)}
      ${renderTaskDueCell(row)}
      <td
        class="task-table-pane__td task-table-pane__td--contacts"
        title=${contactText}
      >
        ${contactText}
      </td>
      ${renderTagCells(row.tags)}
      ${renderIssueStatusCell(row)}
    </tr>
  `;
}
