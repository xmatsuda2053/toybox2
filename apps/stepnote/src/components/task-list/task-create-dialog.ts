import {
  html,
  unsafeCSS,
  type HTMLTemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import {
  format,
  getCurrentFiscalYear,
  getFiscalYearRange,
  dispatchCustomEvent,
} from "@shared/utils";
import type { DatePickerChangeEventDetail } from "@shared/components";
import {
  SubscriberElement,
  WithLabelsController,
  WithTaskController,
  WithTaskTemplateController,
} from "@/utils/controller-consumers.mixin.js";
import { WithDialogBase } from "@/utils/dialog-element.mixin.js";
import { generateTemplateIssuePayloads } from "@/utils/task-template.utils.js";
import type { TaskTemplateRecord } from "@/db/models/template.model.js";
import styles from "./task-create-dialog.scss?inline";

/**
 * 新規タスク作成ダイアログコンポーネント (TaskCreateDialog)
 *
 * Task List パネルヘッダから呼び出され、タスク新規登録用のモーダルフォームを提供する。
 * タスク名（必須）、期日（必須・初期値システム日付）、作業年度、ラベル、テンプレートの入力を受け付ける。
 *
 * @export
 * @class TaskCreateDialog
 * @extends {WithDialogBase(WithTaskController(WithLabelsController(WithTaskTemplateController(SubscriberElement))))}
 */
@customElement("task-create-dialog")
export class TaskCreateDialog extends WithDialogBase(
  WithTaskController(
    WithLabelsController(WithTaskTemplateController(SubscriberElement)),
  ),
) {
  public static styles = unsafeCSS(styles);

  /**
   * 表示対象の会計年度（初期値）
   */
  @property({ type: Number })
  public fiscalYear: number = getCurrentFiscalYear();

  /**
   * 初期選択対象のラベルID
   */
  @property({ type: Number })
  public selectedLabelId?: number;

  /** 入力フォーム状態: タスク名 */
  @state()
  public inputName: string = "";

  /** 入力フォーム状態: 期日（yyyy-MM-dd） */
  @state()
  public inputDueDate: string = format(new Date(), "yyyy-MM-dd");

  /** 入力フォーム状態: 会計年度 */
  @state()
  public inputFiscalYear: number = getCurrentFiscalYear();

  /** 入力フォーム状態: ラベルID */
  @state()
  public inputLabelId: number | undefined;

  /** 入力フォーム状態: テンプレートID */
  @state()
  public inputTemplateId: number | undefined;

  /**
   * フォームの入力バリデーション状態
   * タスク名（非空トリム後）および期日（非空）が必須
   */
  public get isValid(): boolean {
    return (
      this.inputName.trim().length > 0 && this.inputDueDate.trim().length > 0
    );
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has("fiscalYear") && !changedProperties.has("open")) {
      this.inputFiscalYear = this.fiscalYear;
    }
    if (changedProperties.has("selectedLabelId") && !changedProperties.has("open")) {
      this.inputLabelId = this.selectedLabelId;
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has("open") && this.open) {
      this.resetForm();
    }
  }

  /**
   * フォーム入力値を初期状態へリセットする
   */
  public resetForm(): void {
    this.inputName = "";
    this.inputDueDate = format(new Date(), "yyyy-MM-dd");
    this.inputFiscalYear = this.fiscalYear ?? getCurrentFiscalYear();
    this.inputTemplateId = undefined;

    const fallbackLabelId =
      this.selectedLabelId ??
      this.labelsController?.selectedLabelId ??
      (this.labelsController?.state[0]?.id as number | undefined);
    this.inputLabelId = fallbackLabelId;
  }

  /**
   * タスク名入力ハンドラー
   */
  public handleInputName = (e: Event): void => {
    this.inputName = (e.target as HTMLInputElement).value;
  };

  /**
   * 期日変更ハンドラー
   */
  public handleDateChange = (
    e: CustomEvent<DatePickerChangeEventDetail>,
  ): void => {
    this.inputDueDate = e.detail?.value ?? "";
  };

  /**
   * 会計年度変更ハンドラー
   */
  public handleSelectFiscalYear = (e: Event): void => {
    const target = e.target as HTMLElement & { value?: string };
    this.inputFiscalYear = Number(target.value);
  };

  /**
   * ラベル変更ハンドラー
   */
  public handleSelectLabel = (e: Event): void => {
    const target = e.target as HTMLElement & { value?: string };
    const val = target.value;
    this.inputLabelId = val !== undefined && val !== "" ? Number(val) : undefined;
  };

  /**
   * テンプレート変更ハンドラー
   */
  public handleSelectTemplate = (e: Event): void => {
    const target = e.target as HTMLElement & { value?: string };
    const val = target.value;
    this.inputTemplateId =
      val !== undefined && val !== "" ? Number(val) : undefined;
  };

  /**
   * キャンセル操作ハンドラー
   * 子要素（wa-select や popover 等）からバブリングしたイベントは無視する
   */
  public handleCancel = (e?: Event): void => {
    if (e && e.target !== e.currentTarget) {
      return;
    }
    this.resetForm();
    this.closeDialog("dialog-close");
  };

  /**
   * 選択中テンプレートから初期Issueペイロードを生成する
   */
  private resolveTemplateIssues(
    template: TaskTemplateRecord | undefined,
    dueDate: Date,
  ) {
    if (!template) {
      return undefined;
    }
    return generateTemplateIssuePayloads(
      template,
      new Date(),
      dueDate,
      0,
    ).map(({ taskId: _, ...issue }) => issue);
  }

  /**
   * タスク登録保存ハンドラー
   */
  public handleSave = async (e?: Event): Promise<boolean> => {
    e?.preventDefault();
    if (!this.isValid || !this.taskController) {
      return false;
    }

    const [year, month, day] = this.inputDueDate.split("-").map(Number);
    const dueDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const fallbackLabelId =
      this.inputLabelId ??
      this.labelsController?.selectedLabelId ??
      (this.labelsController?.state[0]?.id as number | undefined) ??
      1;

    const selectedTemplate = this.inputTemplateId !== undefined
      ? this.taskTemplateController?.state.find((t) => t.id === this.inputTemplateId)
      : undefined;

    const taskPayload = {
      name: this.inputName.trim(),
      dueDate,
      fiscalYear: this.inputFiscalYear,
      labelId: fallbackLabelId,
      description: selectedTemplate?.description ?? "",
      templateName: selectedTemplate?.name,
    };

    const initialIssues = this.resolveTemplateIssues(selectedTemplate, dueDate);
    const newId = await this.taskController.createTask(taskPayload, initialIssues);

    dispatchCustomEvent(this, "task-created", {
      detail: { taskId: newId, ...taskPayload },
    });
    this.resetForm();
    this.open = false;
    return true;
  };

  /**
   * 年度・ラベル・テンプレート選択項目の描画
   */
  private renderSelectors(): HTMLTemplateResult {
    const fiscalYears = getFiscalYearRange();
    const labels = this.labelsController?.state ?? [];
    const templates = this.taskTemplateController?.state ?? [];

    return html`
      <wa-select
        id="task-create-fiscal-year"
        class="task-create-dialog__field"
        label="対象年度"
        .value=${String(this.inputFiscalYear)}
        @change=${this.handleSelectFiscalYear}
      >
        ${fiscalYears.map((fy) => html`<wa-option value=${String(fy)}>${fy}年度</wa-option>`)}
      </wa-select>
      <wa-select
        id="task-create-label"
        class="task-create-dialog__field"
        label="ラベル"
        .value=${this.inputLabelId !== undefined ? String(this.inputLabelId) : ""}
        @change=${this.handleSelectLabel}
      >
        ${labels.map((l) => html`<wa-option value=${String(l.id)}>${l.name}</wa-option>`)}
      </wa-select>
      <wa-select
        id="task-create-template"
        class="task-create-dialog__field"
        label="テンプレート"
        .value=${this.inputTemplateId !== undefined ? String(this.inputTemplateId) : ""}
        @change=${this.handleSelectTemplate}
      >
        <wa-option value="">テンプレートなし</wa-option>
        ${templates.map((t) => html`<wa-option value=${String(t.id)}>${t.name}</wa-option>`)}
      </wa-select>
    `;
  }

  /**
   * 入力フォーム領域の描画
   */
  private renderForm(): HTMLTemplateResult {
    return html`
      <form
        class="task-create-dialog__form"
        @submit=${this.handleSave}
      >
        <wa-input
          id="task-create-name"
          class="task-create-dialog__field"
          label="タスク名"
          placeholder="タスク名を入力"
          .value=${this.inputName}
          required
          @input=${this.handleInputName}
        ></wa-input>
        <datepicker-input
          id="task-create-due-date"
          class="task-create-dialog__field"
          label="期日"
          required
          size="m"
          .value=${this.inputDueDate}
          @datepicker-change=${this.handleDateChange}
        ></datepicker-input>
        ${this.renderSelectors()}
      </form>
    `;
  }

  /**
   * フッターアクションボタン領域の描画
   */
  private renderFooter(): HTMLTemplateResult {
    return html`
      <div slot="footer" class="task-create-dialog__footer">
        <wa-button
          class="task-create-dialog__btn-cancel"
          variant="text"
          @click=${this.handleCancel}
        >
          キャンセル
        </wa-button>
        <wa-button
          class="task-create-dialog__btn-submit"
          variant="brand"
          ?disabled=${!this.isValid}
          @click=${this.handleSave}
        >
          作成
        </wa-button>
      </div>
    `;
  }

  public override render(): HTMLTemplateResult {
    return html`
      <wa-dialog
        id="task-create-dialog"
        class="task-create-dialog__dialog"
        label="新規タスクの作成"
        ?open=${this.open}
        @wa-after-hide=${this.handleCancel}
      >
        ${this.renderForm()}
        ${this.renderFooter()}
      </wa-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-create-dialog": TaskCreateDialog;
  }
}
