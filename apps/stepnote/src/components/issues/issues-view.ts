import {
  html,
  unsafeCSS,
  type HTMLTemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import type {
  DatePickerChangeEventDetail,
  SearchInputEventDetail,
} from "@shared/components";
import { format } from "@shared/utils";
import type { IssueRecord } from "@/db/models/task.model";
import type { TaskStatusCode } from "@/types";
import {
  TASK_STATUS_LIST,
  TASK_STATUS_ICON_MAP,
  TASK_STATUS_TYPE_MAP,
} from "@/constants/task-status.constants.js";
import {
  SubscriberElement,
  WithIssuesController,
  WithTaskController,
} from "@/utils/controller-consumers.mixin.js";
import {
  filterIssuesByKeyword,
  extractIssueTitle,
  parseBulkIssuesInput,
  groupAndSortIssues,
} from "@/utils/task-filter.utils.js";
import styles from "./issues-view.scss?inline";

/**
 * 課題管理（Issues）コンポーネント (IssuesView)
 *
 * 親タスクに紐づく Issue の一覧表示・インライン詳細展開・一括作成・完了分離・自動保存を提供する。
 * パネルに依存しないポータブルなコンポーネントとして動作する。
 *
 * @export
 * @class IssuesView
 * @extends {WithIssuesController(WithTaskController(SubscriberElement))}
 */
@customElement("issues-view")
export class IssuesView extends WithIssuesController(
  WithTaskController(SubscriberElement),
) {
  public static override styles = unsafeCSS(styles);

  @property({ type: String, attribute: "data-theme", reflect: true })
  public theme: string = "light";

  @state()
  public searchKeyword: string = "";

  @state()
  public expandedIssueIds: Set<number> = new Set();

  @state()
  public collapsingIssueId: number | null = null;

  @state()
  public isDeleteDialogOpen: boolean = false;

  @state()
  public deletingIssueId?: number;

  @state()
  public isBulkAddDialogOpen: boolean = false;

  @state()
  public bulkAddText: string = "";

  private debounceTimerMap: Map<number, ReturnType<typeof setTimeout>> =
    new Map();

  private collapseTimer: ReturnType<typeof setTimeout> | null = null;

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    const parentTaskId = this.taskController?.state?.id;
    if (
      this.issuesController &&
      parentTaskId !== undefined &&
      this.issuesController.taskId !== parentTaskId
    ) {
      this.issuesController.setTaskId(parentTaskId);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const timer of this.debounceTimerMap.values()) {
      clearTimeout(timer);
    }
    this.debounceTimerMap.clear();

    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }
  }

  /** 検索入力ハンドラー */
  public handleSearchInput = (
    event: CustomEvent<SearchInputEventDetail>,
  ): void => {
    this.searchKeyword = event.detail?.keyword ?? "";
  };

  /** インライン詳細の開閉トグルハンドラー（排他展開および折りたたみアニメーション遷移） */
  public handleToggleExpand = (issueId: number): void => {
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }

    const nextSet = new Set(this.expandedIssueIds);
    const currentlyExpanded = Array.from(nextSet)[0];

    if (currentlyExpanded === issueId) {
      nextSet.clear();
      this.collapsingIssueId = issueId;
      this.collapseTimer = setTimeout(() => {
        this.handleDetailAnimationEnd(issueId);
      }, 320);
    } else {
      if (currentlyExpanded !== undefined) {
        this.collapsingIssueId = currentlyExpanded;
        this.collapseTimer = setTimeout(() => {
          this.handleDetailAnimationEnd(currentlyExpanded);
        }, 320);
      } else if (this.collapsingIssueId === issueId) {
        this.collapsingIssueId = null;
      }
      nextSet.clear();
      nextSet.add(issueId);
    }

    this.expandedIssueIds = nextSet;
  };

  /** 詳細パネルのアニメーション終了ハンドラー（アンマウントクリーンアップ） */
  public handleDetailAnimationEnd = (issueId: number): void => {
    if (this.collapsingIssueId === issueId) {
      if (this.collapseTimer) {
        clearTimeout(this.collapseTimer);
        this.collapseTimer = null;
      }
      this.collapsingIssueId = null;
      this.requestUpdate();
    }
  };

  /** 単一新規 Issue 追加ハンドラー（即時作成して自動展開） */
  public handleCreateIssue = async (): Promise<void> => {
    if (!this.issuesController) return;

    const title = "新規Issue";
    const newId = await this.issuesController.createIssue({
      title,
      value: `### ${title}\n\n`,
      statusCode: 0,
      dueDate: new Date(),
    });

    if (newId !== undefined) {
      this.handleToggleExpand(newId);
    }
  };

  /** 複数Issue一括作成ダイアログを開く */
  public handleOpenBulkAddDialog = (): void => {
    this.bulkAddText = "";
    this.isBulkAddDialogOpen = true;
  };

  /** 複数Issue一括作成ダイアログを閉じる */
  public handleCloseBulkAddDialog = (): void => {
    this.isBulkAddDialogOpen = false;
    this.bulkAddText = "";
  };

  /** 複数Issue一括作成確定ハンドラー */
  public handleConfirmBulkAdd = async (): Promise<void> => {
    const titles = parseBulkIssuesInput(this.bulkAddText);
    if (titles.length > 0 && this.issuesController) {
      await this.issuesController.createMultipleIssues(titles, new Date());
    }
    this.handleCloseBulkAddDialog();
  };

  /** 行内でのステータス変更ハンドラー */
  public handleStatusChange = async (
    issueId: number,
    statusCode: TaskStatusCode,
    event?: Event,
  ): Promise<void> => {
    event?.stopPropagation();
    if (this.issuesController) {
      await this.issuesController.updateIssue(issueId, { statusCode });
    }
  };

  /** 行内での期日変更ハンドラー */
  public handleDueDateChange = async (
    issueId: number,
    dueDate: Date,
    event?: Event,
  ): Promise<void> => {
    event?.stopPropagation();
    if (this.issuesController) {
      await this.issuesController.updateIssue(issueId, { dueDate });
    }
  };

  /** Markdown 内容変更ハンドラー（300ms デバウンス自動保存、1行目をタイトルに同期） */
  public handleContentChange = (issueId: number, value: string): void => {
    const existingTimer = this.debounceTimerMap.get(issueId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const saveAction = async (): Promise<void> => {
      if (this.issuesController) {
        const title = extractIssueTitle(value);
        await this.issuesController.updateIssue(issueId, { title, value });
      }
      this.debounceTimerMap.delete(issueId);
    };

    this.debounceTimerMap.set(issueId, setTimeout(saveAction, 300));
  };

  /** 削除リクエストハンドラー（ダイアログを開く） */
  public handleRequestDelete = (issueId: number): void => {
    this.deletingIssueId = issueId;
    this.isDeleteDialogOpen = true;
  };

  /** 削除確認ダイアログを閉じる */
  public handleCloseDeleteDialog = (): void => {
    this.isDeleteDialogOpen = false;
    this.deletingIssueId = undefined;
  };

  /** 削除確定ハンドラー */
  public handleConfirmDelete = async (): Promise<void> => {
    if (this.deletingIssueId !== undefined && this.issuesController) {
      await this.issuesController.deleteIssue(this.deletingIssueId);
      const nextSet = new Set(this.expandedIssueIds);
      nextSet.delete(this.deletingIssueId);
      this.expandedIssueIds = nextSet;
    }
    this.handleCloseDeleteDialog();
  };

  /** 空状態の描画 */
  private renderEmptyState(): HTMLTemplateResult {
    return html`
      <div class="issues-view__empty">
        <span>Issue がありません</span>
      </div>
    `;
  }

  /** 一覧ヘッダーアクションボタン群の描画 */
  private renderHeaderActions(): HTMLTemplateResult {
    return html`
      <div class="issues-view__actions">
        <wa-tooltip
          for="issues-view-btn-bulk-add"
          placement="bottom"
          trigger="hover"
        >
          複数Issueを一括追加
        </wa-tooltip>
        <wa-button
          id="issues-view-btn-bulk-add"
          class="issues-view__btn-bulk-add"
          variant="neutral"
          appearance="plain"
          size="s"
          aria-label="複数Issueを一括追加"
          @click=${this.handleOpenBulkAddDialog}
        >
          <wa-icon library="my-icons" name="list-check-solid-full"></wa-icon>
        </wa-button>
        <wa-tooltip
          for="issues-view-btn-add"
          placement="bottom"
          trigger="hover"
        >
          新規Issueを追加
        </wa-tooltip>
        <wa-button
          id="issues-view-btn-add"
          class="issues-view__btn-add"
          variant="neutral"
          appearance="plain"
          size="s"
          aria-label="新規Issueを追加"
          @click=${this.handleCreateIssue}
        >
          <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
        </wa-button>
      </div>
    `;
  }

  /** 一覧ヘッダーの描画 */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <div class="issues-view__header">
        <search-input
          class="issues-view__search-input"
          size="s"
          placeholder="Issue を検索..."
          .value=${this.searchKeyword}
          @search-input=${this.handleSearchInput}
        ></search-input>
        ${this.renderHeaderActions()}
      </div>
    `;
  }

  /** ステータスドロップダウンの選択肢を描画 */
  private renderStatusDropdownOptions(
    selectedCode: TaskStatusCode,
  ): HTMLTemplateResult[] {
    return TASK_STATUS_LIST.map(
      (status) => html`
        <wa-dropdown-item
          value=${String(status.code)}
          type="checkbox"
          ?checked=${status.code === selectedCode}
        >
          <wa-icon
            slot="icon"
            library="my-icons"
            name=${TASK_STATUS_ICON_MAP[status.code]}
            class="issues-view__status-icon type-${TASK_STATUS_TYPE_MAP[
              status.code
            ]}"
          ></wa-icon>
          ${status.labelJa}
        </wa-dropdown-item>
      `,
    );
  }

  /** 一覧アイテム内のステータス選択ドロップダウンの描画 */
  private renderIssueStatusDropdown(
    issue: IssueRecord,
    typeName: string,
    iconName: string,
  ): HTMLTemplateResult {
    return html`
      <wa-tooltip
        for="issues-view-status-btn-${issue.id}"
        placement="top"
        trigger="hover"
      >
        ステータスを変更
      </wa-tooltip>
      <wa-dropdown
        class="issues-view__status-dropdown"
        @click=${(e: MouseEvent) => e.stopPropagation()}
        @wa-select=${(e: CustomEvent<{ item: { value: string } }>) => {
          e.stopPropagation();
          if (issue.id !== undefined) {
            this.handleStatusChange(
              issue.id,
              Number(e.detail.item.value) as TaskStatusCode,
              e,
            );
          }
        }}
      >
        <button
          id="issues-view-status-btn-${issue.id}"
          type="button"
          slot="trigger"
          class="issues-view__status-btn"
          aria-label="ステータス変更"
        >
          <wa-icon
            class="issues-view__item-status type-${typeName}"
            library="my-icons"
            name=${iconName}
          ></wa-icon>
        </button>
        ${this.renderStatusDropdownOptions(issue.statusCode)}
      </wa-dropdown>
    `;
  }

  /** 一覧アイテム内の期日入力（datepicker-input）の描画 */
  private renderDueDateInput(issue: IssueRecord): HTMLTemplateResult {
    const formattedDue = issue.dueDate
      ? format(new Date(issue.dueDate), "yyyy-MM-dd")
      : "";

    return html`
      <datepicker-input
        class="issues-view__item-due"
        size="s"
        borderless
        .value=${formattedDue}
        @click=${(e: MouseEvent) => e.stopPropagation()}
        @datepicker-change=${(
          e: CustomEvent<DatePickerChangeEventDetail>,
        ) => {
          e.stopPropagation();
          if (issue.id !== undefined && e.detail?.date) {
            this.handleDueDateChange(issue.id, e.detail.date, e);
          }
        }}
      ></datepicker-input>
    `;
  }

  /** インライン詳細エディタの描画 */
  private renderInlineDetail(
    issue: IssueRecord,
    isCollapsing: boolean = false,
  ): HTMLTemplateResult {
    const containerClass = isCollapsing
      ? "issues-view__detail-container issues-view__detail-container--collapsing"
      : "issues-view__detail-container";

    return html`
      <div
        class=${containerClass}
        @animationend=${() =>
          issue.id !== undefined && this.handleDetailAnimationEnd(issue.id)}
      >
        <div class="issues-view__detail">
          <markdown-editor-preview
            class="issues-view__detail-editor"
            .themeMode=${this.theme === "dark" ? "dark" : "light"}
            .darkTheme=${"soft"}
            .value=${issue.value}
            ?show-delete-button=${true}
            @markdown-change=${(e: CustomEvent<{ value: string }>) =>
              issue.id !== undefined &&
              this.handleContentChange(issue.id, e.detail.value)}
            @markdown-delete=${() =>
              issue.id !== undefined && this.handleRequestDelete(issue.id)}
          ></markdown-editor-preview>
        </div>
      </div>
    `;
  }

  /** 単一 Issue アイテムの描画 */
  private renderIssueRow(issue: IssueRecord): HTMLTemplateResult {
    if (issue.id === undefined) return html``;

    const isDone = issue.statusCode === 9;
    const isExpanded = this.expandedIssueIds.has(issue.id);
    const isCollapsing = this.collapsingIssueId === issue.id;
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
          @click=${() => this.handleToggleExpand(issue.id!)}
        >
          ${this.renderIssueStatusDropdown(issue, typeName, iconName)}
          <span class="issues-view__item-title" title=${displayTitle}>
            ${displayTitle}
          </span>
          ${this.renderDueDateInput(issue)}
          <wa-icon
            class="issues-view__item-caret"
            library="my-icons"
            name="caret-right-solid-full"
          ></wa-icon>
        </div>
        ${isExpanded || isCollapsing
          ? this.renderInlineDetail(issue, isCollapsing)
          : ""}
      </div>
    `;
  }

  /** セクション（未完了または完了）の描画 */
  private renderSection(
    title: string,
    issues: IssueRecord[],
  ): HTMLTemplateResult {
    if (issues.length === 0) return html``;

    return html`
      <div class="issues-view__section">
        <div class="issues-view__section-header">
          ${title} (${issues.length})
        </div>
        ${issues.map((issue) => this.renderIssueRow(issue))}
      </div>
    `;
  }

  /** 一覧リストの描画 */
  private renderList(filteredIssues: IssueRecord[]): HTMLTemplateResult {
    if (filteredIssues.length === 0) {
      return this.renderEmptyState();
    }

    const { openIssues, completedIssues } = groupAndSortIssues(filteredIssues);
    const hasDivider = openIssues.length > 0 && completedIssues.length > 0;

    return html`
      <div class="issues-view__list">
        ${this.renderSection("未完了", openIssues)}
        ${hasDivider
          ? html`<wa-divider class="issues-view__divider"></wa-divider>`
          : null}
        ${this.renderSection("完了", completedIssues)}
      </div>
    `;
  }

  /** 削除確認ダイアログの描画 */
  private renderDeleteDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        class="issues-view__delete-dialog"
        label="Issueの削除確認"
        ?open=${this.isDeleteDialogOpen}
        @wa-after-hide=${this.handleCloseDeleteDialog}
      >
        <div class="issues-view__delete-dialog-body">
          このIssueを削除してもよろしいですか？<br />
          ※この操作は取り消せません。
        </div>
        <div slot="footer" class="issues-view__delete-dialog-footer">
          <wa-button
            variant="neutral"
            appearance="plain"
            size="s"
            @click=${this.handleCloseDeleteDialog}
          >
            キャンセル
          </wa-button>
          <wa-button
            variant="danger"
            size="s"
            @click=${this.handleConfirmDelete}
          >
            削除
          </wa-button>
        </div>
      </wa-dialog>
    `;
  }

  /** 複数Issue一括作成ダイアログの描画 */
  private renderBulkAddDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        class="issues-view__bulk-dialog"
        label="複数Issueの一括作成"
        ?open=${this.isBulkAddDialogOpen}
        @wa-after-hide=${this.handleCloseBulkAddDialog}
      >
        <div class="issues-view__bulk-dialog-body">
          <div class="issues-view__bulk-dialog-description">
            1行につき1件のIssueを作成します。期日は本日の日付が設定されます。
          </div>
          <wa-textarea
            class="issues-view__bulk-textarea"
            rows="6"
            placeholder="Issueタイトルを1行ずつ入力...&#10;例:&#10;仕様の確認&#10;画面モック作成&#10;API結合テスト"
            .value=${this.bulkAddText}
            @input=${(e: Event) => {
              this.bulkAddText = (e.target as HTMLTextAreaElement).value;
            }}
          ></wa-textarea>
        </div>
        <div slot="footer" class="issues-view__bulk-dialog-footer">
          <wa-button
            variant="neutral"
            appearance="plain"
            size="s"
            @click=${this.handleCloseBulkAddDialog}
          >
            キャンセル
          </wa-button>
          <wa-button
            variant="brand"
            size="s"
            @click=${this.handleConfirmBulkAdd}
          >
            作成
          </wa-button>
        </div>
      </wa-dialog>
    `;
  }

  override render(): HTMLTemplateResult {
    const allIssues = this.issuesController?.state ?? [];
    const filteredIssues = filterIssuesByKeyword(
      allIssues,
      this.searchKeyword,
    );

    return html`
      <div class="issues-view">
        ${this.renderHeader()}
        ${this.renderList(filteredIssues)}
        ${this.renderDeleteDialog()}
        ${this.renderBulkAddDialog()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "issues-view": IssuesView;
  }
}
