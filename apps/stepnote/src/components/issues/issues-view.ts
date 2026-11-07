import {
  html,
  unsafeCSS,
  type HTMLTemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import "@shared/components";
import type {
  DatePickerChangeEventDetail,
  SearchInputEventDetail,
  MarkdownDisplayMode,
  MarkdownEditorCommand,
} from "@shared/components";
import { format } from "@shared/utils";
import type { IssueRecord } from "@/db/models/task.model";
import type { TaskTemplateRecord } from "@/db/models/template.model.js";
import type { TaskStatusCode } from "@/types";
import {
  TASK_STATUS_ICON_MAP,
  TASK_STATUS_TYPE_MAP,
} from "@/constants/task-status.constants.js";
import {
  SubscriberElement,
  WithIssuesController,
  WithTaskController,
  WithTaskTemplateController,
} from "@/utils/controller-consumers.mixin.js";
import {
  filterIssuesByKeyword,
  extractIssueTitle,
  parseBulkIssuesInput,
  groupAndSortIssues,
} from "@/utils/task-filter.utils.js";
import { getTaskDueIconInfo } from "@/utils/task-due.utils.js";
import {
  KeyedDebounceManager,
  ExclusiveAccordionController,
  DeleteDialogState,
  resetModesToPreview,
  extractSearchQuery,
} from "@/utils/view-state.utils.js";
import styles from "./issues-view.scss?inline";

/**
 * 課題管理（Issues）コンポーネント (IssuesView)
 *
 * 親タスクに紐づく Issue の一覧表示・インライン詳細展開・一括作成・完了分離・自動保存を提供する。
 * パネルに依存しないポータブルなコンポーネントとして動作する。
 *
 * @export
 * @class IssuesView
 * @extends {WithIssuesController(WithTaskController(WithTaskTemplateController(SubscriberElement)))}
 */
@customElement("issues-view")
export class IssuesView extends WithIssuesController(
  WithTaskController(
    WithTaskTemplateController(SubscriberElement),
  ),
) {
  public static override styles = unsafeCSS(styles);

  private static readonly ISSUE_COMMANDS: readonly MarkdownEditorCommand[] = [
    { label: "ジャンプ用タグをコピー", eventName: "copy-jump-tag" },
  ];

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
  public isAddDialogOpen: boolean = false;

  @state()
  public addText: string = "";

  @state()
  public isTemplateDialogOpen: boolean = false;

  @state()
  public selectedTemplateId: number | null = null;

  @state()
  public issueModeMap: Map<number, MarkdownDisplayMode> = new Map();

  private readonly accordion = new ExclusiveAccordionController();

  private readonly deleteDialog = new DeleteDialogState();

  private readonly debounceManager = new KeyedDebounceManager();

  private lastTaskId?: number;

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    this.syncParentTaskState();
  }

  /** 親タスク切り替え時の状態初期化およびコントローラー同期 */
  private syncParentTaskState(): void {
    const parentTaskId = this.taskController?.state?.id;
    if (this.lastTaskId !== parentTaskId) {
      this.lastTaskId = parentTaskId;
      this.accordion.reset();
      this.expandedIssueIds = new Set();
      this.collapsingIssueId = null;
      this.issueModeMap.clear();
    }
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
    this.debounceManager.clear();
    this.accordion.reset();
  }

  /** 全 Issue のエディタモードをプレビューモードへリセットする */
  public resetModesToPreview(): void {
    resetModesToPreview(this.issueModeMap);
    this.requestUpdate();
  }

  /** 検索入力ハンドラー */
  public handleSearchInput = (
    eventOrQuery: CustomEvent<SearchInputEventDetail> | string,
  ): void => {
    this.searchKeyword = extractSearchQuery(eventOrQuery);
  };

  /** インライン詳細の開閉トグルハンドラー（排他展開および折りたたみアニメーション遷移、プレビューモード初期化） */
  public handleToggleExpand = (issueId: number): void => {
    this.accordion.expandedIds = new Set(this.expandedIssueIds);
    this.accordion.collapsingId = this.collapsingIssueId;

    this.accordion.toggle(
      issueId,
      (id) => this.issueModeMap.set(id, "preview"),
      (id) => this.handleDetailAnimationEnd(id),
    );

    this.expandedIssueIds = this.accordion.expandedIds;
    this.collapsingIssueId = this.accordion.collapsingId;
  };

  /** 指定した Issue を展開状態にする */
  public expandIssue = (issueId: number): void => {
    if (!this.expandedIssueIds.has(issueId)) {
      this.handleToggleExpand(issueId);
    }
  };

  /**
   * ジャンプ用タグのクリップボードコピーハンドラー
   */
  public handleCopyJumpTag = async (issueId: number): Promise<void> => {
    const issue = this.issuesController?.state?.find((i) => i.id === issueId);
    if (!issue) return;

    const copyText = `#[${issueId}]{${issue.title}}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(copyText);
    }
  };

  /** エディタ表示モード変更ハンドラー */
  public handleModeChange = (
    issueId: number,
    mode: MarkdownDisplayMode,
  ): void => {
    this.issueModeMap.set(issueId, mode);
    this.requestUpdate();
  };

  /** 詳細パネルのアニメーション終了ハンドラー（アンマウントクリーンアップ） */
  public handleDetailAnimationEnd = (issueId: number): void => {
    if (this.accordion.handleAnimationEnd(issueId)) {
      this.collapsingIssueId = null;
      this.requestUpdate();
    }
  };

  /** Issue追加ダイアログを開く */
  public handleOpenAddDialog = (): void => {
    this.addText = "";
    this.isAddDialogOpen = true;
  };

  /** Issue追加ダイアログを閉じる */
  public handleCloseAddDialog = (e?: Event): void => {
    if (e && e.target !== e.currentTarget) {
      return;
    }
    this.isAddDialogOpen = false;
    this.addText = "";
  };

  /** Issue追加確定ハンドラー（単一・複数行一括対応） */
  public handleConfirmAdd = async (): Promise<void> => {
    const titles = parseBulkIssuesInput(this.addText);
    if (titles.length > 0 && this.issuesController) {
      await this.issuesController.createMultipleIssues(titles);
    }
    this.handleCloseAddDialog();
  };

  /** テンプレート適用ダイアログを開く */
  public handleOpenTemplateDialog = (): void => {
    this.isTemplateDialogOpen = true;
    this.selectedTemplateId = null;
  };

  /** テンプレート適用ダイアログを閉じる（子要素からのバブリングを無視） */
  public handleCloseTemplateDialog = (e?: Event): void => {
    if (e && e.target !== e.currentTarget) {
      return;
    }
    this.isTemplateDialogOpen = false;
    this.selectedTemplateId = null;
  };

  /** テンプレート選択変更ハンドラー */
  public handleSelectTemplate = (e: Event): void => {
    const target = (e.currentTarget ?? e.target) as
      | (HTMLElement & { value?: string })
      | null;
    const value = target?.value;
    if (!value) {
      this.selectedTemplateId = null;
      return;
    }
    const id = Number(value);
    this.selectedTemplateId = Number.isNaN(id) ? null : id;
  };

  /** テンプレート適用確定ハンドラー */
  public handleConfirmApplyTemplate = async (): Promise<void> => {
    if (this.selectedTemplateId === null || !this.issuesController) {
      return;
    }
    const template = this.taskTemplateController?.state.find(
      (t) => t.id === this.selectedTemplateId,
    );
    if (!template) {
      return;
    }

    try {
      const parentTaskId = this.taskController?.state?.id;
      if (
        parentTaskId !== undefined &&
        this.issuesController.taskId !== parentTaskId &&
        typeof this.issuesController.setTaskId === "function"
      ) {
        await this.issuesController.setTaskId(parentTaskId);
      }

      const taskDueDate = this.taskController?.state?.dueDate;
      await this.issuesController.applyTemplate(template, taskDueDate);
    } catch (error) {
      console.error("Failed to apply issue template:", error);
    } finally {
      this.handleCloseTemplateDialog();
    }
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

  /** 行内でのステータストグル（0 ⇄ 9）ハンドラー */
  public handleToggleStatus = async (
    issueId: number,
    currentStatusCode: TaskStatusCode,
    event?: Event,
  ): Promise<void> => {
    event?.stopPropagation();
    const nextStatusCode: TaskStatusCode = currentStatusCode === 9 ? 0 : 9;
    if (this.issuesController) {
      await this.issuesController.updateIssue(issueId, { statusCode: nextStatusCode });
    }
  };

  /** 行内での期日変更ハンドラー */
  public handleDueDateChange = async (
    issueId: number,
    dueDate: Date | null,
    event?: Event,
  ): Promise<void> => {
    event?.stopPropagation();
    if (this.issuesController) {
      await this.issuesController.updateIssue(issueId, {
        dueDate: dueDate ?? undefined,
      });
    }
  };

  /** Markdown 内容変更ハンドラー（300ms デバウンス自動保存、1行目をタイトルに同期） */
  public handleContentChange = (issueId: number, value: string): void => {
    this.debounceManager.debounce(
      issueId,
      async () => {
        if (this.issuesController) {
          const title = extractIssueTitle(value);
          await this.issuesController.updateIssue(issueId, { title, value });
        }
      },
      300,
    );
  };

  /** 削除リクエストハンドラー（ダイアログを開く） */
  public handleRequestDelete = (issueId: number): void => {
    this.deleteDialog.open(issueId);
    this.isDeleteDialogOpen = this.deleteDialog.isOpen;
    this.deletingIssueId = this.deleteDialog.deletingId;
  };

  /** 削除確認ダイアログを閉じる（子要素からのバブリングを無視） */
  public handleCloseDeleteDialog = (e?: Event): void => {
    if (e && e.target !== e.currentTarget) {
      return;
    }
    this.deleteDialog.close();
    this.isDeleteDialogOpen = false;
    this.deletingIssueId = undefined;
  };

  /** 削除確定ハンドラー */
  public handleConfirmDelete = async (): Promise<void> => {
    if (this.deletingIssueId !== undefined && this.issuesController) {
      await this.issuesController.deleteIssue(this.deletingIssueId);
      this.issueModeMap.delete(this.deletingIssueId);
      const nextSet = new Set(this.expandedIssueIds);
      nextSet.delete(this.deletingIssueId);
      this.expandedIssueIds = nextSet;
      this.accordion.expandedIds = nextSet;
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
          @click=${this.handleOpenTemplateDialog}
        >
          <wa-icon library="my-icons" name="list-check-solid-full"></wa-icon>
        </wa-button>
        <wa-tooltip
          for="issues-view-btn-add"
          placement="bottom"
          trigger="hover"
        >
          Issueを追加
        </wa-tooltip>
        <wa-button
          id="issues-view-btn-add"
          class="issues-view__btn-add"
          variant="neutral"
          appearance="plain"
          size="s"
          aria-label="Issueを追加"
          @click=${this.handleOpenAddDialog}
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

  /** 一覧アイテム内のステータス選択・トグルボタンの描画 */
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
      <button
        id="issues-view-status-btn-${issue.id}"
        type="button"
        class="issues-view__status-btn"
        aria-label="ステータス変更"
        @click=${(e: MouseEvent) => {
          e.stopPropagation();
          if (issue.id !== undefined) {
            this.handleToggleStatus(issue.id, issue.statusCode, e);
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

  /** Issue の期限情報（アイコン名および修飾クラス）を取得する */
  private getIssueDueDisplay(issue: IssueRecord): {
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

  /** 一覧アイテム内の期日入力（datepicker-input）の描画 */
  private renderDueDateInput(issue: IssueRecord): HTMLTemplateResult {
    const formattedDue = issue.dueDate
      ? format(new Date(issue.dueDate), "yyyy-MM-dd")
      : "";
    const { icon, modifierClass } = this.getIssueDueDisplay(issue);
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
        @datepicker-change=${(
          e: CustomEvent<DatePickerChangeEventDetail>,
        ) => {
          e.stopPropagation();
          if (issue.id !== undefined) {
            this.handleDueDateChange(issue.id, e.detail?.date ?? null, e);
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
    const currentMode =
      (issue.id !== undefined && this.issueModeMap.get(issue.id)) || "preview";

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
            .mode=${currentMode}
            ?show-delete-button=${true}
            .commands=${IssuesView.ISSUE_COMMANDS}
            @copy-jump-tag=${() =>
              issue.id !== undefined && this.handleCopyJumpTag(issue.id)}
            @mode-change=${(e: CustomEvent<{ mode: MarkdownDisplayMode }>) =>
              issue.id !== undefined &&
              this.handleModeChange(issue.id, e.detail.mode)}
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
          <span class="issues-view__item-id">#${issue.id}</span>
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
        ${repeat(
          issues,
          (issue) => issue.id,
          (issue) => this.renderIssueRow(issue),
        )}
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

  /** Issue追加ダイアログの描画 */
  private renderAddDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        class="issues-view__add-dialog"
        label="Issueの追加"
        ?open=${this.isAddDialogOpen}
        @wa-after-hide=${this.handleCloseAddDialog}
      >
        <div class="issues-view__add-dialog-body">
          <div class="issues-view__add-dialog-description">
            1行につき1件のIssueを作成します。
          </div>
          <wa-textarea
            class="issues-view__add-textarea"
            rows="6"
            placeholder="Issueタイトルを入力（改行で複数件追加）...&#10;例:&#10;仕様の確認&#10;画面モック作成&#10;API結合テスト"
            .value=${this.addText}
            @input=${(e: Event) => {
              this.addText = (e.target as HTMLTextAreaElement).value;
            }}
          ></wa-textarea>
        </div>
        <div slot="footer" class="issues-view__add-dialog-footer">
          <wa-button
            variant="neutral"
            appearance="plain"
            size="s"
            @click=${this.handleCloseAddDialog}
          >
            キャンセル
          </wa-button>
          <wa-button
            variant="brand"
            size="s"
            @click=${this.handleConfirmAdd}
          >
            作成
          </wa-button>
        </div>
      </wa-dialog>
    `;
  }

  /** テンプレートプレビュー一覧の描画 */
  private renderTemplatePreview(
    template: TaskTemplateRecord,
  ): HTMLTemplateResult {
    const issues = template.issues ?? [];
    if (issues.length === 0) {
      return html`
        <div class="issues-view__template-preview">
          <div class="issues-view__template-preview-empty">
            このテンプレートにはIssueが登録されていません。
          </div>
        </div>
      `;
    }
    return html`
      <div class="issues-view__template-preview">
        <div class="issues-view__template-preview-header">
          含まれるIssue（${issues.length}件）:
        </div>
        <ul class="issues-view__template-preview-list">
          ${issues.map(
            (issue) => html`
              <li class="issues-view__template-preview-item">
                ${issue.value ? extractIssueTitle(issue.value) : "（無題）"}
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  /** テンプレート適用ダイアログ本文の描画 */
  private renderTemplateDialogBody(
    templates: readonly TaskTemplateRecord[],
    selectedTemplate?: TaskTemplateRecord,
  ): HTMLTemplateResult {
    if (templates.length === 0) {
      return html`
        <div class="issues-view__template-empty-message">
          利用可能なテンプレートがありません（設定画面から作成できます）。
        </div>
      `;
    }

    return html`
      <div class="issues-view__template-select-container">
        <label
          class="issues-view__template-label"
          for="issues-view-template-select"
        >
          適用するテンプレート
        </label>
        <wa-select
          id="issues-view-template-select"
          class="issues-view__template-select"
          placeholder="テンプレートを選択..."
          .value=${this.selectedTemplateId !== null
            ? String(this.selectedTemplateId)
            : ""}
          @change=${this.handleSelectTemplate}
        >
          ${templates.map(
            (t) =>
              html`<wa-option value=${String(t.id)}>
                ${t.name}
              </wa-option>`,
          )}
        </wa-select>
      </div>
      ${selectedTemplate ? this.renderTemplatePreview(selectedTemplate) : null}
    `;
  }

  /** Issueテンプレート適用ダイアログの描画 */
  private renderTemplateDialog(): HTMLTemplateResult {
    const templates = this.taskTemplateController?.state ?? [];
    const selectedTemplate = templates.find(
      (t) => t.id === this.selectedTemplateId,
    );
    const isApplyDisabled =
      this.selectedTemplateId === null ||
      !selectedTemplate ||
      (selectedTemplate.issues?.length ?? 0) === 0;

    return html`
      <wa-dialog
        class="issues-view__template-dialog"
        label="Issueテンプレートの適用"
        ?open=${this.isTemplateDialogOpen}
        @wa-after-hide=${this.handleCloseTemplateDialog}
      >
        <div class="issues-view__template-dialog-body">
          ${this.renderTemplateDialogBody(templates, selectedTemplate)}
        </div>
        <div slot="footer" class="issues-view__template-dialog-footer">
          <wa-button
            variant="neutral"
            appearance="plain"
            size="s"
            @click=${this.handleCloseTemplateDialog}
          >
            キャンセル
          </wa-button>
          <wa-button
            id="issues-view-btn-confirm-apply"
            variant="brand"
            size="s"
            ?disabled=${isApplyDisabled}
            @click=${this.handleConfirmApplyTemplate}
          >
            適用
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
        ${this.renderAddDialog()}
        ${this.renderTemplateDialog()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "issues-view": IssuesView;
  }
}
