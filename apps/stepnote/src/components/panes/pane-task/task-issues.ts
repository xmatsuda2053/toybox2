import {
  html,
  unsafeCSS,
  type HTMLTemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import type { DatePickerChangeEventDetail } from "@shared/components";
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
import { sortIssuesByDueDateAndTitle } from "@/utils/task-filter.utils.js";
import styles from "./task-issues.scss?inline";


/**
 * サブタスク（Issues）タブコンポーネント (TaskIssues)
 *
 * 親タスクに紐づく Issue の一覧表示・完了切り替え・新規作成・詳細編集・自動保存を提供する。
 *
 * @export
 * @class TaskIssues
 * @extends {WithIssuesController(WithTaskController(SubscriberElement))}
 */
@customElement("task-issues")
export class TaskIssues extends WithIssuesController(
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
  public editingIssueId?: number;

  @state()
  public editorMode: "edit" | "preview" | "split" = "edit";

  @state()
  public isDeleteDialogOpen: boolean = false;

  // 下書きキャッシュ（新規時・編集時）
  private draftTitle: string = "";
  private draftValue: string = "";
  private draftDueDate: Date = new Date();
  private draftStatusCode: TaskStatusCode = 0;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  /** 新規 Issue 作成画面を開く */
  public handleAddNewIssue = (): void => {
    this.viewMode = "detail";
    this.editingIssueId = undefined;
    this.draftTitle = "";
    this.draftValue = "";
    this.draftDueDate = new Date();
    this.draftStatusCode = 0;
    this.editorMode = "edit";
  };

  /** 既存 Issue 詳細画面を開く */
  public handleSelectIssue = (issue: IssueRecord): void => {
    this.viewMode = "detail";
    this.editingIssueId = issue.id;
    this.draftTitle = issue.title;
    this.draftValue = issue.value;
    this.draftDueDate = new Date(issue.dueDate);
    this.draftStatusCode = issue.statusCode;
    this.editorMode = issue.value.trim() !== "" ? "preview" : "edit";
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
        // 新規作成
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
      <div class="task-issues__empty">
        <span>Issue がありません</span>
      </div>
    `;
  }

  /** タスク名ヘッダーの描画 */
  private renderTaskName(): HTMLTemplateResult {
    const taskName = this.taskController?.state?.name ?? "";
    return html`
      <div class="task-issues__task-name" title=${taskName}>${taskName}</div>
    `;
  }

  /** 一覧ヘッダーの描画 */
  private renderListHeader(): HTMLTemplateResult {
    return html`
      <div class="task-issues__header">
        <wa-switch
          class="task-issues__toggle-completed"
          size="s"
          ?checked=${this.showCompleted}
          @change=${this.handleToggleShowCompleted}
        >
          完了したIssueを含める
        </wa-switch>
        <div class="task-issues__actions">
          <wa-tooltip
            for="task-issues-btn-add"
            placement="bottom"
            trigger="hover"
          >
            新規Issueを追加
          </wa-tooltip>
          <wa-button
            id="task-issues-btn-add"
            class="task-issues__btn-add"
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
          class="task-issues__item-status type-${typeName}"
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
                  class="task-issues__status-icon type-${TASK_STATUS_TYPE_MAP[
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
    const itemClass = `task-issues__item ${isDone ? "task-issues__item--completed" : ""}`;
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
        <span class="task-issues__item-title" title=${displayTitle}>
          ${displayTitle}
        </span>
        <span class="task-issues__item-due">${dueStr}</span>
      </div>
    `;
  }

  /** 一覧ビューの描画 */
  private renderListView(): HTMLTemplateResult {
    const allIssues = this.issuesController?.state ?? [];
    const filteredIssues = this.showCompleted
      ? allIssues
      : allIssues.filter((i) => i.statusCode !== 9);
    const sortedIssues = sortIssuesByDueDateAndTitle(filteredIssues);

    return html`
      <div class="task-issues">
        ${this.renderTaskName()} ${this.renderListHeader()}
        ${sortedIssues.length === 0
          ? this.renderEmptyState()
          : html`
              <div class="task-issues__list">
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
          class="task-issues__status-icon"
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
        class="task-issues__status"
        variant="neutral"
        size="s"
        with-caret
        caret
      >
        <wa-icon
          slot="start"
          library="my-icons"
          name=${icon}
          class="task-issues__status-icon type-${type}"
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
        class="task-issues__status-dropdown"
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
      <div class="task-issues__detail-header">
        <wa-button
          class="task-issues__btn-back"
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
        <div class="task-issues__detail-actions">
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
      <div class="task-issues__field">
        <label class="task-issues__label">タイトル</label>
        <div class="task-issues__control">
          <wa-input
            class="task-issues__title-input"
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
      <div class="task-issues__field">
        <label class="task-issues__label">期日</label>
        <div class="task-issues__control">
          <datepicker-input
            class="task-issues__due-date"
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
      <div class="task-issues__field task-issues__field--content">
        <markdown-editor-preview
          class="task-issues__editor"
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
        class="task-issues__delete-dialog"
        label="Issueの削除確認"
        ?open=${this.isDeleteDialogOpen}
        @wa-after-hide=${this.handleCloseDeleteDialog}
      >
        <div class="task-issues__delete-dialog-body">
          このIssueを削除してもよろしいですか？<br />
          ※この操作は取り消せません。
        </div>
        <div slot="footer" class="task-issues__delete-dialog-footer">
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
      <div class="task-issues task-issues__detail">
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
    "task-issues": TaskIssues;
  }
}
