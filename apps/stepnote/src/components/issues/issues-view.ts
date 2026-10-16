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
  TASK_STATUS_MAP,
  TASK_STATUS_ICON_MAP,
  TASK_STATUS_TYPE_MAP,
} from "@/constants/task-status.constants.js";
import {
  SubscriberElement,
  WithIssuesController,
  WithTaskController,
} from "@/utils/controller-consumers.mixin.js";
import {
  sortIssuesByDueDateAndTitle,
  filterIssuesByKeyword,
} from "@/utils/task-filter.utils.js";
import styles from "./issues-view.scss?inline";

/**
 * 課題管理（Issues）コンポーネント (IssuesView)
 *
 * 親タスクに紐づく Issue の一覧表示・完了切り替え・新規作成・詳細編集・自動保存を提供する。
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

  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public viewMode: "list" | "detail" = "list";

  @state()
  public showCompleted: boolean = false;

  @state()
  public searchKeyword: string = "";

  @state()
  public editingIssueId?: number;

  @state()
  public editorMode: "edit" | "preview" | "split" = "edit";

  @state()
  public isDeleteDialogOpen: boolean = false;

  private draftTitle: string = "";
  private draftDueDate: Date = new Date();
  private draftValue: string = "";
  private draftStatusCode: TaskStatusCode = 0;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  /** 検索入力ハンドラー */
  public handleSearchInput = (
    event: CustomEvent<SearchInputEventDetail>,
  ): void => {
    this.searchKeyword = event.detail?.keyword ?? "";
  };

  /** 新規 Issue 追加開始ハンドラー */
  public handleAddNewIssue = (): void => {
    this.editingIssueId = undefined;
    this.draftTitle = "";
    this.draftDueDate = new Date();
    this.draftValue = "";
    this.draftStatusCode = 0;
    this.editorMode = "edit";
    this.viewMode = "detail";
  };

  /** Issue 選択・詳細編集開始ハンドラー */
  public handleSelectIssue = (issue: IssueRecord): void => {
    this.editingIssueId = issue.id;
    this.draftTitle = issue.title;
    this.draftDueDate = issue.dueDate ? new Date(issue.dueDate) : new Date();
    this.draftValue = issue.value;
    this.draftStatusCode = issue.statusCode;
    this.editorMode = "edit";
    this.viewMode = "detail";
  };

  /** 削除確認ダイアログを開く */
  public handleOpenDeleteDialog = (): void => {
    this.isDeleteDialogOpen = true;
  };

  /** 削除確認ダイアログを閉じる */
  public handleCloseDeleteDialog = (): void => {
    this.isDeleteDialogOpen = false;
  };

  /** 削除確認ダイアログでの削除確定ハンドラー */
  public handleConfirmDelete = async (): Promise<void> => {
    if (this.editingIssueId !== undefined) {
      await this.handleDeleteIssue(this.editingIssueId);
    }
    this.handleCloseDeleteDialog();
  };

  /** Markdown 表示モード変更ハンドラー */
  public handleModeChange = (mode: "edit" | "preview" | "split"): void => {
    this.editorMode = mode;
  };

  /** 一覧画面へ戻る */
  public handleBackToList = (): void => {
    this.viewMode = "list";
    this.editingIssueId = undefined;
  };

  /** 完了表示トグル切り替え */
  public handleToggleShowCompleted = (e?: Event): void => {
    if (e?.target && "checked" in e.target) {
      this.showCompleted = Boolean((e.target as { checked: boolean }).checked);
    } else {
      this.showCompleted = !this.showCompleted;
    }
  };

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

  /** ステータス変更ハンドラー（一覧または詳細） */
  public handleStatusChange = async (
    arg1: number | TaskStatusCode,
    arg2?: TaskStatusCode,
  ): Promise<void> => {
    let issueId: number | undefined;
    let code: TaskStatusCode;

    if (arg2 !== undefined) {
      issueId = arg1 as number;
      code = arg2;
    } else {
      issueId = this.editingIssueId;
      code = arg1 as TaskStatusCode;
    }

    this.draftStatusCode = code;
    if (issueId !== undefined && this.issuesController) {
      await this.issuesController.updateIssue(issueId, { statusCode: code });
    } else {
      await this.scheduleSave({ statusCode: code }, 0);
    }
    this.requestUpdate();
  };

  /** 詳細画面ステータスドロップダウン選択ハンドラー */
  public handleDetailDropdownSelect = async (value: string): Promise<void> => {
    if (value === "delete") {
      this.handleOpenDeleteDialog();
    } else {
      await this.handleStatusChange(Number(value) as TaskStatusCode);
    }
  };

  /** タイトル入力ハンドラー（自動保存） */
  public handleTitleInput = (title: string): void => {
    this.draftTitle = title;
    this.scheduleSave({ title });
  };

  /** タイトル確定・変更ハンドラー（即時自動保存） */
  public handleTitleChange = async (title: string): Promise<void> => {
    this.draftTitle = title;
    await this.scheduleSave({ title }, 0);
  };

  /** 期日変更ハンドラー（自動保存） */
  public handleDueDateChange = (dueDate: Date): void => {
    this.draftDueDate = dueDate;
    this.scheduleSave({ dueDate }, 0);
  };

  /** Markdown 内容変更ハンドラー（自動保存） */
  public handleContentChange = (value: string): void => {
    this.draftValue = value;
    this.scheduleSave({ value });
  };

  /** Issue 削除ハンドラー */
  public handleDeleteIssue = async (issueId: number): Promise<void> => {
    if (this.issuesController) {
      await this.issuesController.deleteIssue(issueId);
    }
    this.handleBackToList();
  };

  /** 自動保存スケジュール実行（新規作成または更新） */
  private async scheduleSave(
    partial: Partial<Omit<IssueRecord, "id" | "taskId">>,
    delayMs: number = 300,
  ): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }

    const execute = async (): Promise<void> => {
      if (!this.issuesController) return;

      if (this.editingIssueId !== undefined) {
        await this.issuesController.updateIssue(this.editingIssueId, partial);
      } else {
        const newId = await this.issuesController.createIssue({
          title: this.draftTitle,
          value: this.draftValue,
          dueDate: this.draftDueDate,
          statusCode: this.draftStatusCode,
          ...partial,
        });
        if (newId !== undefined) {
          this.editingIssueId = newId;
        }
      }
    };

    if (delayMs === 0) {
      await execute();
    } else {
      this.debounceTimer = setTimeout(execute, delayMs);
    }
  }

  /** 空状態の描画 */
  private renderEmptyState(): HTMLTemplateResult {
    return html`
      <div class="issues-view__empty">
        <span>Issue がありません</span>
      </div>
    `;
  }

  /** 一覧ヘッダーの描画 */
  private renderListHeader(): HTMLTemplateResult {
    return html`
      <div class="issues-view__header">
        <search-input
          class="issues-view__search-input"
          size="s"
          placeholder="Issue を検索..."
          .value=${this.searchKeyword}
          @search-input=${this.handleSearchInput}
        ></search-input>
        <div class="issues-view__actions">
          <wa-tooltip
            for="issues-view-toggle-completed"
            placement="bottom"
            trigger="hover"
          >
            完了したIssueを含める
          </wa-tooltip>
          <wa-switch
            id="issues-view-toggle-completed"
            class="issues-view__toggle-completed"
            size="s"
            aria-label="完了したIssueを含める"
            ?checked=${this.showCompleted}
            @change=${this.handleToggleShowCompleted}
          ></wa-switch>
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
            @click=${this.handleAddNewIssue}
          >
            <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
          </wa-button>
        </div>
      </div>
    `;
  }

  /** 一覧アイテム内のステータス選択ドロップダウンの描画 */
  private renderIssueStatusDropdown(
    issue: IssueRecord,
    typeName: string,
    iconName: string,
  ): HTMLTemplateResult {
    return html`
      <wa-dropdown
        @wa-select=${(e: CustomEvent<{ item: { value: string } }>) => {
          e.stopPropagation();
          if (issue.id !== undefined) {
            this.handleStatusChange(
              issue.id,
              Number(e.detail.item.value) as TaskStatusCode,
            );
          }
        }}
      >
        <wa-icon
          slot="trigger"
          class="issues-view__item-status type-${typeName}"
          library="my-icons"
          name=${iconName}
          @click=${(e: MouseEvent) => e.stopPropagation()}
        ></wa-icon>
        ${this.renderStatusDropdownOptions(issue.statusCode, false)}
      </wa-dropdown>
    `;
  }

  /**
   * ステータスドロップダウンの選択肢を描画
   */
  private renderStatusDropdownOptions(
    selectedCode: TaskStatusCode,
    withIcon: boolean = false,
  ): HTMLTemplateResult[] {
    return TASK_STATUS_LIST.map(
      (status) => html`
        <wa-dropdown-item
          value=${String(status.code)}
          type="checkbox"
          ?checked=${status.code === selectedCode}
        >
          ${withIcon
            ? html`
                <wa-icon
                  slot="icon"
                  library="my-icons"
                  name=${TASK_STATUS_ICON_MAP[status.code]}
                  class="issues-view__status-icon type-${TASK_STATUS_TYPE_MAP[
                    status.code
                  ]}"
                ></wa-icon>
              `
            : null}
          ${status.labelJa}
        </wa-dropdown-item>
      `,
    );
  }

  /** 単一 Issue アイテムの描画 */
  private renderIssueItem(issue: IssueRecord): HTMLTemplateResult {
    const isDone = issue.statusCode === 9;
    const itemClass = `issues-view__item ${isDone ? "issues-view__item--completed" : ""}`;
    const iconName =
      TASK_STATUS_ICON_MAP[issue.statusCode] ?? TASK_STATUS_ICON_MAP[0];
    const typeName =
      TASK_STATUS_TYPE_MAP[issue.statusCode] ?? TASK_STATUS_TYPE_MAP[0];
    const dueStr = issue.dueDate
      ? format(new Date(issue.dueDate), "yyyy-MM-dd")
      : "";
    const displayTitle = issue.title || "（無題）";

    return html`
      <div
        class=${itemClass}
        role="button"
        tabindex="0"
        @click=${() => this.handleSelectIssue(issue)}
      >
        ${this.renderIssueStatusDropdown(issue, typeName, iconName)}
        <span class="issues-view__item-title" title=${displayTitle}>
          ${displayTitle}
        </span>
        <span class="issues-view__item-due">${dueStr}</span>
      </div>
    `;
  }

  /** 一覧ビューの描画 */
  private renderListView(): HTMLTemplateResult {
    const allIssues = this.issuesController?.state ?? [];
    const completedFiltered = this.showCompleted
      ? allIssues
      : allIssues.filter((i) => i.statusCode !== 9);
    const keywordFiltered = filterIssuesByKeyword(
      completedFiltered,
      this.searchKeyword,
    );
    const sortedIssues = sortIssuesByDueDateAndTitle(keywordFiltered);

    return html`
      <div class="issues-view">
        ${this.renderListHeader()}
        ${sortedIssues.length === 0
          ? this.renderEmptyState()
          : html`
              <div class="issues-view__list">
                ${sortedIssues.map((issue) => this.renderIssueItem(issue))}
              </div>
            `}
      </div>
    `;
  }

  /** ドロップダウン内の削除項目の描画 */
  private renderDropdownDeleteAction(): HTMLTemplateResult | null {
    if (this.editingIssueId === undefined) return null;

    return html`
      <wa-divider></wa-divider>
      <wa-dropdown-item
        value="delete"
        variant="danger"
        type="checkbox"
      >
        <wa-icon
          slot="icon"
          library="my-icons"
          name="trash-solid-full"
          class="issues-view__status-icon"
        ></wa-icon>
        削除
      </wa-dropdown-item>
    `;
  }

  /** ステータスドロップダウントリガーボタンの描画 */
  private renderStatusTriggerButton(
    labelJa: string,
    icon: string,
    type: string,
  ): HTMLTemplateResult {
    return html`
      <wa-button
        slot="trigger"
        class="issues-view__status"
        variant="neutral"
        size="s"
        with-caret
        caret
      >
        <wa-icon
          slot="start"
          library="my-icons"
          name=${icon}
          class="issues-view__status-icon type-${type}"
        ></wa-icon>
        ${labelJa}
      </wa-button>
    `;
  }

  /** 詳細ヘッダー内ステータスドロップダウンの描画 */
  private renderDetailStatusDropdown(
    statusCode: TaskStatusCode,
    currentStatus: (typeof TASK_STATUS_LIST)[number],
    currentIcon: string,
    currentType: string,
  ): HTMLTemplateResult {
    return html`
      <wa-dropdown
        class="issues-view__status-dropdown"
        @wa-select=${(e: CustomEvent<{ item: { value: string } }>) =>
          this.handleDetailDropdownSelect(e.detail.item.value)}
      >
        ${this.renderStatusTriggerButton(
          currentStatus.labelJa,
          currentIcon,
          currentType,
        )}
        ${this.renderStatusDropdownOptions(statusCode, true)}
        ${this.renderDropdownDeleteAction()}
      </wa-dropdown>
    `;
  }

  /** 詳細ヘッダーの描画 */
  private renderDetailHeader(issue?: IssueRecord): HTMLTemplateResult {
    const statusCode = issue?.statusCode ?? this.draftStatusCode;
    const currentStatus = TASK_STATUS_MAP[statusCode] ?? TASK_STATUS_MAP[0];
    const currentIcon =
      TASK_STATUS_ICON_MAP[statusCode] ?? TASK_STATUS_ICON_MAP[0];
    const currentType =
      TASK_STATUS_TYPE_MAP[statusCode] ?? TASK_STATUS_TYPE_MAP[0];

    return html`
      <div class="issues-view__detail-header">
        <wa-button
          class="issues-view__btn-back"
          variant="neutral"
          size="s"
          appearance="plain"
          @click=${this.handleBackToList}
        >
          <wa-icon
            slot="start"
            library="my-icons"
            name="angle-left-solid-full"
          ></wa-icon>
          一覧に戻る
        </wa-button>
        <div class="issues-view__detail-actions">
          ${this.renderDetailStatusDropdown(
            statusCode,
            currentStatus,
            currentIcon,
            currentType,
          )}
        </div>
      </div>
    `;
  }

  /** タイトル入力フィールドの描画 */
  private renderTitleField(title: string): HTMLTemplateResult {
    return html`
      <div class="issues-view__field">
        <label class="issues-view__label">タイトル</label>
        <div class="issues-view__control">
          <wa-input
            class="issues-view__title-input"
            size="s"
            .value=${title}
            placeholder="Issueタイトルを入力"
            @input=${(e: Event) =>
              this.handleTitleInput((e.target as HTMLInputElement).value)}
            @change=${(e: Event) =>
              this.handleTitleChange((e.target as HTMLInputElement).value)}
            @blur=${(e: Event) =>
              this.handleTitleChange((e.target as HTMLInputElement).value)}
          ></wa-input>
        </div>
      </div>
    `;
  }

  /** 期日入力フィールドの描画 */
  private renderDueDateField(formattedDueDate: string): HTMLTemplateResult {
    return html`
      <div class="issues-view__field">
        <label class="issues-view__label">期日</label>
        <div class="issues-view__control">
          <datepicker-input
            class="issues-view__due-date"
            size="s"
            .value=${formattedDueDate}
            @datepicker-change=${(
              e: CustomEvent<DatePickerChangeEventDetail>,
            ) => {
              if (e.detail?.date) {
                this.handleDueDateChange(e.detail.date);
              }
            }}
          ></datepicker-input>
        </div>
      </div>
    `;
  }

  /** Markdown エディタフィールドの描画 */
  private renderEditorField(value: string): HTMLTemplateResult {
    return html`
      <div class="issues-view__field issues-view__field--content">
        <markdown-editor-preview
          class="issues-view__editor"
          .themeMode=${this.theme === "dark" ? "dark" : "light"}
          .darkTheme=${"soft"}
          .value=${value}
          .mode=${this.editorMode}
          @mode-change=${(
            e: CustomEvent<{ mode: "edit" | "preview" | "split" }>,
          ) => this.handleModeChange(e.detail.mode)}
          @markdown-change=${(e: CustomEvent<{ value: string }>) =>
            this.handleContentChange(e.detail.value)}
        ></markdown-editor-preview>
      </div>
    `;
  }

  /** 詳細フォームの描画 */
  private renderDetailForm(issue?: IssueRecord): HTMLTemplateResult {
    const title = issue?.title ?? this.draftTitle;
    const rawDueDate = issue?.dueDate
      ? new Date(issue.dueDate)
      : this.draftDueDate;
    const formattedDueDate = rawDueDate
      ? format(new Date(rawDueDate), "yyyy-MM-dd")
      : "";
    const value = issue?.value ?? this.draftValue;

    return html`
      ${this.renderTitleField(title)}
      ${this.renderDueDateField(formattedDueDate)}
      ${this.renderEditorField(value)}
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

  /** 詳細ビューの描画 */
  private renderDetailView(): HTMLTemplateResult {
    const issue = this.issuesController?.state.find(
      (i) => i.id === this.editingIssueId,
    );

    return html`
      <div class="issues-view issues-view__detail">
        ${this.renderDetailHeader(issue)} ${this.renderDetailForm(issue)}
        ${this.renderDeleteDialog()}
      </div>
    `;
  }

  override render(): HTMLTemplateResult {
    return this.viewMode === "list"
      ? this.renderListView()
      : this.renderDetailView();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "issues-view": IssuesView;
  }
}
