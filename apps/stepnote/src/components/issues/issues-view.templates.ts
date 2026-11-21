import { html, type HTMLTemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type {
  DatePickerChangeEventDetail,
  MarkdownDisplayMode,
  MarkdownEditorCommand,
  SearchInputEventDetail,
} from "@shared/components";
import { format } from "@shared/utils";
import type { IssueRecord } from "@/db/models/task.model";
import type { TaskStatusCode } from "@/types";
import {
  TASK_STATUS_ICON_MAP,
  TASK_STATUS_TYPE_MAP,
} from "@/constants/task-status.constants.js";
import {
  extractIssueTitle,
  groupAndSortIssues,
} from "@/utils/task-filter.utils.js";
import { getTaskDueIconInfo } from "@/utils/task-due.utils.js";

/** Issue 一覧ヘッダー描画パラメーター */
export interface IssuesHeaderParams {
  searchKeyword: string;
  onSearchInput: (e: CustomEvent<SearchInputEventDetail> | string) => void;
  onOpenTemplateDialog: () => void;
  onOpenAddDialog: () => void;
}

/** Issue 一覧本体描画パラメーター */
export interface IssuesListParams {
  filteredIssues: IssueRecord[];
  expandedIssueIds: Set<number>;
  collapsingIssueId: number | null;
  issueModeMap: Map<number, MarkdownDisplayMode>;
  theme: string;
  commands: readonly MarkdownEditorCommand[];
  onToggleExpand: (issueId: number) => void;
  onToggleStatus: (
    issueId: number,
    statusCode: TaskStatusCode,
    event?: Event,
  ) => Promise<void> | void;
  onDueDateChange: (
    issueId: number,
    dueDate: Date | null,
    event?: Event,
  ) => Promise<void> | void;
  onDetailAnimationEnd: (issueId: number) => void;
  onCopyJumpTag: (issueId: number) => Promise<void> | void;
  onModeChange: (issueId: number, mode: MarkdownDisplayMode) => void;
  onContentChange: (issueId: number, value: string) => void;
  onRequestDelete: (issueId: number) => void;
}

/**
 * Issue の期限アイコン名および警告修飾クラスを計算する。
 */
export function getIssueDueDisplay(issue: IssueRecord): {
  icon: string;
  modifierClass: string;
} {
  if (issue.statusCode === 9 || !issue.dueDate) {
    return { icon: "calendar-solid-full", modifierClass: "" };
  }
  const dueInfo = getTaskDueIconInfo(issue.dueDate);
  if (!dueInfo) {
    return { icon: "calendar-solid-full", modifierClass: "" };
  }
  return {
    icon: dueInfo.icon,
    modifierClass: `issues-view__item-due--${dueInfo.status}`,
  };
}

function renderHeaderActions(params: IssuesHeaderParams): HTMLTemplateResult {
  return html`
    <div class="issues-view__actions">
      <wa-tooltip
        for="issues-view-btn-template"
        placement="bottom"
        trigger="hover"
      >
        テンプレートを適用
      </wa-tooltip>
      <wa-button
        id="issues-view-btn-template"
        class="issues-view__btn-template"
        variant="neutral"
        appearance="plain"
        size="s"
        aria-label="テンプレートを適用"
        @click=${params.onOpenTemplateDialog}
      >
        <wa-icon library="my-icons" name="list-check-solid-full"></wa-icon>
      </wa-button>
      <wa-tooltip for="issues-view-btn-add" placement="bottom" trigger="hover">
        Issueを追加
      </wa-tooltip>
      <wa-button
        id="issues-view-btn-add"
        class="issues-view__btn-add"
        variant="neutral"
        appearance="plain"
        size="s"
        aria-label="Issueを追加"
        @click=${params.onOpenAddDialog}
      >
        <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
      </wa-button>
    </div>
  `;
}

/**
 * Issues 一覧ヘッダーツールバーを描画する。
 */
export function renderIssuesHeader(
  params: IssuesHeaderParams,
): HTMLTemplateResult {
  return html`
    <div class="issues-view__header">
      <search-input
        class="issues-view__search-input"
        size="s"
        placeholder="Issue を検索..."
        .value=${params.searchKeyword}
        @search-input=${params.onSearchInput}
      ></search-input>
      ${renderHeaderActions(params)}
    </div>
  `;
}

function renderIssueStatusDropdown(
  issue: IssueRecord,
  typeName: string,
  iconName: string,
  onToggleStatus: IssuesListParams["onToggleStatus"],
): HTMLTemplateResult {
  return html`
    <wa-tooltip
      for="issues-view-status-btn-${issue.id}"
      placement="top"
      trigger="hover"
    >
      ステータスを変更
    </wa-tooltip>
    <button
      id="issues-view-status-btn-${issue.id}"
      type="button"
      class="issues-view__status-btn"
      aria-label="ステータス変更"
      @click=${(e: MouseEvent) => {
        e.stopPropagation();
        if (issue.id !== undefined) {
          onToggleStatus(issue.id, issue.statusCode, e);
        }
      }}
    >
      <wa-icon
        class="issues-view__item-status type-${typeName}"
        library="my-icons"
        name=${iconName}
      ></wa-icon>
    </button>
  `;
}

function renderDueDateInput(
  issue: IssueRecord,
  onDueDateChange: IssuesListParams["onDueDateChange"],
): HTMLTemplateResult {
  const formattedDue = issue.dueDate
    ? format(new Date(issue.dueDate), "yyyy-MM-dd")
    : "";
  const { icon, modifierClass } = getIssueDueDisplay(issue);
  const dueId = `issues-view-due-${issue.id}`;
  const itemClass = modifierClass
    ? `issues-view__item-due ${modifierClass}`
    : "issues-view__item-due";

  return html`
    <wa-tooltip for="${dueId}" placement="top" trigger="hover">
      期限日
    </wa-tooltip>
    <datepicker-input
      id="${dueId}"
      class="${itemClass}"
      size="s"
      borderless
      icon="${icon}"
      .value=${formattedDue}
      @click=${(e: MouseEvent) => e.stopPropagation()}
      @datepicker-change=${(e: CustomEvent<DatePickerChangeEventDetail>) => {
        e.stopPropagation();
        if (issue.id !== undefined) {
          onDueDateChange(issue.id, e.detail?.date ?? null, e);
        }
      }}
    ></datepicker-input>
  `;
}

function renderInlineDetail(
  issue: IssueRecord,
  isCollapsing: boolean,
  params: IssuesListParams,
): HTMLTemplateResult {
  const containerClass = isCollapsing
    ? "issues-view__detail-container issues-view__detail-container--collapsing"
    : "issues-view__detail-container";
  const currentMode =
    (issue.id !== undefined && params.issueModeMap.get(issue.id)) || "preview";

  return html`
    <div
      class=${containerClass}
      @animationend=${() =>
        issue.id !== undefined && params.onDetailAnimationEnd(issue.id)}
    >
      <div class="issues-view__detail">
        <markdown-editor-preview
          class="issues-view__detail-editor"
          .themeMode=${params.theme === "dark" ? "dark" : "light"}
          .darkTheme=${"soft"}
          .value=${issue.value}
          .mode=${currentMode}
          ?show-delete-button=${true}
          .commands=${params.commands}
          @copy-jump-tag=${() =>
            issue.id !== undefined && params.onCopyJumpTag(issue.id)}
          @mode-change=${(e: CustomEvent<{ mode: MarkdownDisplayMode }>) =>
            issue.id !== undefined && params.onModeChange(issue.id, e.detail.mode)}
          @markdown-change=${(e: CustomEvent<{ value: string }>) =>
            issue.id !== undefined &&
            params.onContentChange(issue.id, e.detail.value)}
          @markdown-delete=${() =>
            issue.id !== undefined && params.onRequestDelete(issue.id)}
        ></markdown-editor-preview>
      </div>
    </div>
  `;
}

function renderIssueRow(
  issue: IssueRecord,
  params: IssuesListParams,
): HTMLTemplateResult {
  if (issue.id === undefined) return html``;

  const isDone = issue.statusCode === 9;
  const isExpanded = params.expandedIssueIds.has(issue.id);
  const isCollapsing = params.collapsingIssueId === issue.id;
  const itemClass = `issues-view__item ${isDone ? "issues-view__item--completed" : ""} ${isExpanded ? "issues-view__item--expanded" : ""}`;
  const iconName =
    TASK_STATUS_ICON_MAP[issue.statusCode] ?? TASK_STATUS_ICON_MAP[0];
  const typeName =
    TASK_STATUS_TYPE_MAP[issue.statusCode] ?? TASK_STATUS_TYPE_MAP[0];
  const displayTitle = issue.title || extractIssueTitle(issue.value);

  return html`
    <div class="issues-view__row-group">
      <div
        class=${itemClass}
        role="button"
        tabindex="0"
        @click=${() => params.onToggleExpand(issue.id!)}
      >
        ${renderIssueStatusDropdown(
          issue,
          typeName,
          iconName,
          params.onToggleStatus,
        )}
        <span class="issues-view__item-id">#${issue.id}</span>
        <span class="issues-view__item-title" title=${displayTitle}>
          ${displayTitle}
        </span>
        ${renderDueDateInput(issue, params.onDueDateChange)}
        <wa-icon
          class="issues-view__item-caret"
          library="my-icons"
          name="caret-right-solid-full"
        ></wa-icon>
      </div>
      ${isExpanded || isCollapsing
        ? renderInlineDetail(issue, isCollapsing, params)
        : ""}
    </div>
  `;
}

function renderSection(
  title: string,
  issues: IssueRecord[],
  params: IssuesListParams,
): HTMLTemplateResult {
  if (issues.length === 0) return html``;

  return html`
    <div class="issues-view__section">
      <div class="issues-view__section-header">
        ${title} (${issues.length})
      </div>
      ${repeat(
        issues,
        (issue) => issue.id,
        (issue) => renderIssueRow(issue, params),
      )}
    </div>
  `;
}

/**
 * Issues 一覧本体（空状態または未完了/完了セクション）を描画する。
 */
export function renderIssuesList(params: IssuesListParams): HTMLTemplateResult {
  if (params.filteredIssues.length === 0) {
    return html`
      <div class="issues-view__empty">
        <span>Issue がありません</span>
      </div>
    `;
  }

  const { openIssues, completedIssues } = groupAndSortIssues(
    params.filteredIssues,
  );
  const hasDivider = openIssues.length > 0 && completedIssues.length > 0;

  return html`
    <div class="issues-view__list">
      ${renderSection("未完了", openIssues, params)}
      ${hasDivider
        ? html`<wa-divider class="issues-view__divider"></wa-divider>`
        : null}
      ${renderSection("完了", completedIssues, params)}
    </div>
  `;
}
