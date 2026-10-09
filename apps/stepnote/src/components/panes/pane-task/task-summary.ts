import {
  html,
  nothing,
  unsafeCSS,
  type HTMLTemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import "@shared/components";
import type {
  DatePickerChangeEventDetail,
  MarkdownDisplayMode,
} from "@shared/components";
import { debounce, format } from "@shared/utils";
import type { Contact } from "@/types";
import { taskContext } from "@/contexts/index.js";
import type { TaskController } from "@/controllers/task.controller.js";
import {
  SubscriberElement,
  WithTaskController,
} from "@/utils/controller-consumers.mixin.js";
import { getTaskDueIconInfo } from "@/utils/task-due.utils.js";
import "./task-contact.js";
import styles from "./task-summary.scss?inline";

/**
 * Summary タブコンポーネント (TaskSummary)
 *
 * タスクの主要情報（タスク名、期日、関係者、詳細説明）の表示およびインライン編集を提供する。
 *
 * @export
 * @class TaskSummary
 * @extends {WithTaskController(SubscriberElement)}
 */
@customElement("task-summary")
export class TaskSummary extends WithTaskController(SubscriberElement) {
  public static styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  /**
   * Markdown 詳細説明の表示モード
   */
  @state()
  public descriptionMode: MarkdownDisplayMode = "edit";

  /**
   * Markdown 詳細説明のコンテンツ展開モードフラグ
   */
  @state()
  public isContentExpand: boolean = false;

  private _lastTaskId?: number;

  private debouncedUpdateName = debounce((name: string) => {
    this.taskController?.updateSummary({ name });
  }, 300);

  private debouncedUpdateDescription = debounce((description: string) => {
    this.taskController?.updateSummary({ description });
  }, 300);

  @consume({ context: taskContext, subscribe: true })
  @property({ attribute: false })
  public override set taskController(controller: TaskController | undefined) {
    super.taskController = controller;
    this.syncDescriptionMode();
  }

  public override get taskController(): TaskController | undefined {
    return super.taskController;
  }

  /**
   * 詳細説明の有無に応じて表示モード（edit / preview）を同期する。
   */
  public syncDescriptionMode(): void {
    const task = this.taskController?.state;
    if (!task) {
      this.descriptionMode = "edit";
      this._lastTaskId = undefined;
      return;
    }

    if (this._lastTaskId !== task.id) {
      this._lastTaskId = task.id;
      const desc = task.description ?? "";
      this.descriptionMode = desc.trim() !== "" ? "preview" : "edit";
    }
  }

  public override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    this.syncDescriptionMode();
  }

  public override disconnectedCallback(): void {
    this.debouncedUpdateName.cancel();
    this.debouncedUpdateDescription.cancel();
    super.disconnectedCallback();
  }

  /**
   * タスク名入力ハンドラー
   */
  public handleNameInput = (name: string): void => {
    this.debouncedUpdateName(name);
  };

  /**
   * 期限日変更ハンドラー
   */
  public handleDueDateChange = (dueDate: Date | null): void => {
    if (!dueDate) return;
    this.taskController?.updateSummary({ dueDate });
  };

  /**
   * 関係者一覧変更ハンドラー
   */
  public handleContactsChange = (contacts: Contact[]): void => {
    this.taskController?.updateSummary({ contacts });
  };

  /**
   * 関係者追加ハンドラー
   */
  public handleAddContact = (): void => {
    const currentContacts = this.taskController?.state?.contacts ?? [];
    const nextContacts: Contact[] = [
      ...currentContacts,
      { div: "", name: "", tel: "" },
    ];
    this.taskController?.updateSummary({ contacts: nextContacts });
  };

  /**
   * 詳細説明変更ハンドラー
   */
  public handleDescriptionChange = (description: string): void => {
    this.debouncedUpdateDescription(description);
  };

  /**
   * Markdown 詳細説明の高さモード切替ハンドラー
   */
  public handleHeightModeChange = (
    e: CustomEvent<{ autoHeight: boolean }>,
  ): void => {
    this.isContentExpand = e.detail?.autoHeight ?? false;
  };

  /**
   * 期限ステータスアイコン（slot="start"）を描画する
   */
  private renderDueStatusIcon(): HTMLTemplateResult | typeof nothing {
    const dueDate = this.taskController?.state?.dueDate;
    const dueInfo = getTaskDueIconInfo(dueDate);
    if (!dueInfo) {
      return nothing;
    }

    return html`
      <wa-icon
        slot="start"
        library="my-icons"
        name="${dueInfo.icon}"
        class="task-summary__name-due-icon task-summary__name-due-icon--${dueInfo.status}"
      ></wa-icon>
    `;
  }

  /**
   * タスク名フィールドの描画
   */
  private renderNameField(): HTMLTemplateResult {
    const task = this.taskController?.state;
    return html`
      <div class="task-summary__field">
        <label class="task-summary__label">タスク名</label>
        <div class="task-summary__control">
          <wa-input
            class="task-summary__name-input"
            size="s"
            placeholder="タスク名を入力..."
            .value=${task?.name ?? ""}
            @input=${(e: Event) =>
              this.handleNameInput((e.target as HTMLInputElement).value)}
          >
            ${this.renderDueStatusIcon()}
          </wa-input>
        </div>
      </div>
    `;
  }

  /**
   * 期限日フィールドの描画
   */
  private renderDueDateField(): HTMLTemplateResult {
    const task = this.taskController?.state;
    const formattedDueDate = task?.dueDate
      ? format(new Date(task.dueDate), "yyyy-MM-dd")
      : "";

    return html`
      <div class="task-summary__field">
        <label class="task-summary__label">期限日</label>
        <div class="task-summary__control">
          <datepicker-input
            class="task-summary__due-date"
            size="s"
            .value=${formattedDueDate}
            @datepicker-change=${(
              e: CustomEvent<DatePickerChangeEventDetail>,
            ) => this.handleDueDateChange(e.detail.date)}
          ></datepicker-input>
        </div>
      </div>
    `;
  }

  /**
   * 関係者フィールドの描画
   */
  private renderContactsField(): HTMLTemplateResult {
    const task = this.taskController?.state;
    return html`
      <div class="task-summary__field">
        <label class="task-summary__label task-summary__label--contacts">
          <span>関係者</span>
          <wa-icon
            class="task-summary__btn-add-contact"
            library="my-icons"
            name="circle-plus"
            aria-label="関係者を追加"
            role="button"
            tabindex="0"
            @click=${this.handleAddContact}
            @keydown=${(e: KeyboardEvent) =>
              (e.key === "Enter" || e.key === " ") && this.handleAddContact()}
          ></wa-icon>
        </label>
        <div class="task-summary__control">
          <task-contact
            class="task-summary__contacts"
            .contacts=${task?.contacts ?? []}
            @contacts-change=${(e: CustomEvent<{ contacts: Contact[] }>) =>
              this.handleContactsChange(e.detail.contacts)}
          ></task-contact>
        </div>
      </div>
    `;
  }

  /**
   * 詳細説明（Markdown）フィールドの描画
   */
  private renderDescriptionField(): HTMLTemplateResult {
    const task = this.taskController?.state;
    const themeMode = this.theme === "dark" ? "dark" : "light";
    return html`
      <div class="task-summary__field task-summary__field--description">
        <markdown-editor-preview
          class="task-summary__description"
          .value=${task?.description ?? ""}
          .mode=${this.descriptionMode}
          .themeMode=${themeMode}
          @markdown-change=${(e: CustomEvent<{ value: string }>) =>
            this.handleDescriptionChange(e.detail.value)}
          @height-mode-change=${this.handleHeightModeChange}
        ></markdown-editor-preview>
      </div>
    `;
  }

  /**
   * 空状態の描画
   */
  private renderEmptyState(): HTMLTemplateResult {
    return html`
      <div class="task-summary task-summary--empty">
        <span>タスクが選択されていません</span>
      </div>
    `;
  }

  /**
   * メインレンダリング
   */
  public render(): HTMLTemplateResult {
    const task = this.taskController?.state;
    if (!task) {
      return this.renderEmptyState();
    }

    const expandClass = this.isContentExpand
      ? "task-summary--content-expand"
      : "";

    return html`
      <div class="task-summary ${expandClass}">
        ${this.renderNameField()} ${this.renderDueDateField()}
        ${this.renderContactsField()} ${this.renderDescriptionField()}
      </div>
    `;
  }
}
