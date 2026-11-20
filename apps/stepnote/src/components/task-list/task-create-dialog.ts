import {
  html,
  nothing,
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
  WithTagsController,
  WithTagSetsController,
  WithTaskController,
  WithTaskTemplateController,
} from "@/utils/controller-consumers.mixin.js";
import { WithDialogBase } from "@/utils/dialog-element.mixin.js";
import { generateTemplateIssuePayloads } from "@/utils/task-template.utils.js";
import {
  normalizeTagIds,
  resolveWaTagVariant,
} from "@/utils/tag.utils.js";
import type { TaskTemplateRecord } from "@/db/models/template.model.js";
import type { LabelRecord } from "@/db/models/navigation.model.js";
import type { TagRecord, TagSetRecord } from "@/db/models/tag.model.js";
import { sortLabelsByNameAsc } from "@/components/navigation/navigation-labels.utils.js";
import styles from "./task-create-dialog.scss?inline";

/**
 * 新規タスク作成ダイアログコンポーネント (TaskCreateDialog)
 *
 * Task List パネルヘッダから呼び出され、タスク新規登録用のモーダルフォームを提供する。
 * タスク名（必須）、期日（必須・初期値システム日付）、作業年度、ラベル、テンプレート、タグセットの入力を受け付ける。
 *
 * @export
 * @class TaskCreateDialog
 */
@customElement("task-create-dialog")
export class TaskCreateDialog extends WithDialogBase(
  WithTagSetsController(
    WithTagsController(
      WithTaskController(
        WithLabelsController(WithTaskTemplateController(SubscriberElement)),
      ),
    ),
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

  /** 入力フォーム状態: 選択中のタグセットID */
  @state()
  public inputTagSetId: number | undefined;

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
   * ラベル名の昇順（辞書順・自然順）でソートされたラベル一覧を取得する
   *
   * @readonly
   * @type {readonly LabelRecord[]}
   * @memberof TaskCreateDialog
   */
  public get sortedLabels(): readonly LabelRecord[] {
    const raw = this.labelsController?.state ?? [];
    return sortLabelsByNameAsc(raw);
  }

  /**
   * 選択中のタグセットを取得する
   */
  public get selectedTagSet(): TagSetRecord | undefined {
    if (this.inputTagSetId === undefined || !this.tagSetsController) {
      return undefined;
    }
    return this.tagSetsController.getTagSetById(this.inputTagSetId);
  }

  /**
   * 選択中タグセットに含まれるタグレコード一覧（プレビュー用）を取得する
   */
  public get selectedTagSetTags(): TagRecord[] {
    const tagSet = this.selectedTagSet;
    if (!tagSet || !this.tagsController || tagSet.tagIds.length === 0) {
      return [];
    }
    return this.tagsController.getTagsByIds(tagSet.tagIds);
  }

  /**
   * フォーム入力値を初期状態へリセットする
   */
  public resetForm(): void {
    this.inputName = "";
    this.inputDueDate = format(new Date(), "yyyy-MM-dd");
    this.inputFiscalYear = this.fiscalYear ?? getCurrentFiscalYear();
    this.inputTemplateId = undefined;
    this.inputTagSetId = undefined;

    const fallbackLabelId =
      this.selectedLabelId ??
      this.labelsController?.selectedLabelId ??
      (this.sortedLabels[0]?.id as number | undefined);
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
   * タグセット変更ハンドラー
   */
  public handleSelectTagSet = (e: Event): void => {
    const target = e.target as HTMLElement & { value?: string };
    const val = target.value;
    this.inputTagSetId =
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
      (this.sortedLabels[0]?.id as number | undefined) ??
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
      tagIds: normalizeTagIds(this.selectedTagSet?.tagIds),
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
   * 左側ラベル＋右側コントロールの横並びフォーム行を描画する
   */
  private renderFormRow(
    forId: string,
    label: string,
    control: HTMLTemplateResult,
    options?: {
      required?: boolean;
      extra?: HTMLTemplateResult | typeof nothing;
    },
  ): HTMLTemplateResult {
    return html`
      <div class="task-create-dialog__row">
        <label class="task-create-dialog__label" for="${forId}">
          ${label}${options?.required
            ? html`<span class="task-create-dialog__required" aria-hidden="true">*</span>`
            : nothing}
        </label>
        <div class="task-create-dialog__control">${control}</div>
        ${options?.extra ?? nothing}
      </div>
    `;
  }

  /**
   * wa-select を持つ横並びフォーム行を描画する
   */
  private renderSelectRow(
    id: string,
    label: string,
    value: string,
    onChange: (e: Event) => void,
    optionsContent: HTMLTemplateResult,
    extra?: HTMLTemplateResult | typeof nothing,
  ): HTMLTemplateResult {
    return this.renderFormRow(
      id,
      label,
      html`
        <wa-select
          id="${id}"
          class="task-create-dialog__field"
          aria-label="${label}"
          .value=${value}
          @change=${onChange}
        >
          ${optionsContent}
        </wa-select>
      `,
      { extra },
    );
  }

  /**
   * 年度・ラベル・テンプレート選択項目の描画
   */
  private renderSelectors(): HTMLTemplateResult {
    const fiscalYears = getFiscalYearRange();
    const labels = this.sortedLabels;
    const templates = this.taskTemplateController?.state ?? [];

    return html`
      ${this.renderSelectRow(
        "task-create-fiscal-year",
        "対象年度",
        String(this.inputFiscalYear),
        this.handleSelectFiscalYear,
        html`${fiscalYears.map((fy) => html`<wa-option value=${String(fy)}>${fy}年度</wa-option>`)}`,
      )}
      ${this.renderSelectRow(
        "task-create-label",
        "ラベル",
        this.inputLabelId !== undefined ? String(this.inputLabelId) : "",
        this.handleSelectLabel,
        html`${labels.map((l) => html`<wa-option value=${String(l.id)}>${l.name}</wa-option>`)}`,
      )}
      ${this.renderSelectRow(
        "task-create-template",
        "テンプレート",
        this.inputTemplateId !== undefined ? String(this.inputTemplateId) : "",
        this.handleSelectTemplate,
        html`
          <wa-option value="">テンプレートなし</wa-option>
          ${templates.map((t) => html`<wa-option value=${String(t.id)}>${t.name}</wa-option>`)}
        `,
      )}
    `;
  }

  /**
   * 選択中タグセットに含まれるタグのプレビュー一覧を描画する
   */
  private renderTagPreview(): HTMLTemplateResult | typeof nothing {
    const previewTags = this.selectedTagSetTags;
    if (previewTags.length === 0) {
      return nothing;
    }

    return html`
      <div class="task-create-dialog__tag-preview">
        ${previewTags.map(
          (tag) => html`
            <wa-tag
              class="task-create-dialog__tag-preview-item stepnote-tag stepnote-tag--${tag.variant}"
              size="s"
              pill
              appearance="filled"
              variant=${resolveWaTagVariant(tag.variant)}
              title=${tag.description || tag.name}
            >
              ${tag.name}
            </wa-tag>
          `,
        )}
      </div>
    `;
  }

  /**
   * タグセット選択欄および付与タグプレビューの描画
   */
  private renderTagSetField(): HTMLTemplateResult {
    const tagSets = this.tagSetsController?.state ?? [];

    return this.renderSelectRow(
      "task-create-tag-set",
      "タグセット",
      this.inputTagSetId !== undefined ? String(this.inputTagSetId) : "",
      this.handleSelectTagSet,
      html`
        <wa-option value="">タグセットなし</wa-option>
        ${tagSets.map(
          (set) =>
            html`<wa-option value=${String(set.id ?? "")}>${set.name}</wa-option>`,
        )}
      `,
      this.renderTagPreview(),
    );
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
        ${this.renderFormRow(
          "task-create-name",
          "タスク名",
          html`
            <wa-input
              id="task-create-name"
              class="task-create-dialog__field"
              aria-label="タスク名"
              placeholder="タスク名を入力"
              .value=${this.inputName}
              required
              @input=${this.handleInputName}
            ></wa-input>
          `,
          { required: true },
        )}
        ${this.renderFormRow(
          "task-create-due-date",
          "期日",
          html`
            <datepicker-input
              id="task-create-due-date"
              class="task-create-dialog__field"
              aria-label="期日"
              required
              size="m"
              .value=${this.inputDueDate}
              @datepicker-change=${this.handleDateChange}
            ></datepicker-input>
          `,
          { required: true },
        )}
        ${this.renderSelectors()}
        ${this.renderTagSetField()}
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
