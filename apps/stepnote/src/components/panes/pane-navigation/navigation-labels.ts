import {
  LitElement,
  html,
  unsafeCSS,
  nothing,
  type HTMLTemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { labelsContext } from "@/contexts/index.js";
import type { LabelsController } from "@/controllers/labels.controller.js";
import type { LabelRecord } from "@/db/models/navigation.model.js";
import labelsStyles from "./navigation-labels.scss?inline";

/**
 * Navigation Labels コンポーネント (NavigationLabels)
 *
 * Navigation ペイン下部に配置され、ラベル一覧の表示・選択トグル、
 * 新規作成ダイアログ、編集ダイアログ、および削除確認機能を提供する。
 *
 * @export
 * @class NavigationLabels
 * @extends {LitElement}
 */
@customElement("navigation-labels")
export class NavigationLabels extends LitElement {
  public static override styles = unsafeCSS(labelsStyles);

  /**
   * LabelsController の購読解除関数
   *
   * @private
   * @type {(() => void) | undefined}
   */
  private unsubLabels?: () => void;

  /**
   * 内部で保持する LabelsController インスタンス
   *
   * @private
   * @type {LabelsController | undefined}
   */
  private _labelsController?: LabelsController;

  /**
   * ラベル管理コントローラーを取得する。
   *
   * @type {LabelsController | undefined}
   */
  public get labelsController(): LabelsController | undefined {
    return this._labelsController;
  }

  /**
   * ラベル管理コントローラーを設定し、状態変更の購読を開始する。
   *
   * @param {LabelsController | undefined} controller
   */
  @consume({ context: labelsContext, subscribe: true })
  @property({ attribute: false })
  public set labelsController(controller: LabelsController | undefined) {
    if (this._labelsController === controller) return;

    if (this.unsubLabels) {
      this.unsubLabels();
      this.unsubLabels = undefined;
    }

    this._labelsController = controller;

    if (controller) {
      this.unsubLabels = controller.subscribe(() => {
        this.requestUpdate();
      });
    }

    this.requestUpdate();
  }

  /**
   * 新規作成/編集ダイアログの開閉状態
   *
   * @type {boolean}
   */
  @state()
  public isAddDialogOpen = false;

  /**
   * 削除確認ダイアログの開閉状態
   *
   * @type {boolean}
   */
  @state()
  public isDeleteDialogOpen = false;

  /**
   * 編集中のラベルレコード（null の場合は新規作成）
   *
   * @type {LabelRecord | null}
   */
  @state()
  public editingLabel: LabelRecord | null = null;

  /**
   * 削除対象のラベルレコード
   *
   * @type {LabelRecord | null}
   */
  @state()
  public deletingLabel: LabelRecord | null = null;

  /**
   * ダイアログ入力中のラベル名
   *
   * @type {string}
   */
  @state()
  public inputName = "";

  /**
   * ダイアログ入力中の説明
   *
   * @type {string}
   */
  @state()
  public inputDescription = "";

  /**
   * コンポーネントが DOM から切断された際のクリーンアップ処理
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.unsubLabels) {
      this.unsubLabels();
      this.unsubLabels = undefined;
    }
  }

  /**
   * 新規登録ダイアログを開くハンドラー
   */
  public handleOpenAddDialog = (): void => {
    this.editingLabel = null;
    this.inputName = "";
    this.inputDescription = "";
    this.isAddDialogOpen = true;
  };

  /**
   * 編集ダイアログを開くハンドラー
   *
   * @param {LabelRecord} label
   */
  public handleOpenEditDialog = (label: LabelRecord): void => {
    this.editingLabel = label;
    this.inputName = label.name;
    this.inputDescription = label.description;
    this.isAddDialogOpen = true;
  };

  /**
   * 削除確認ダイアログを開くハンドラー
   *
   * @param {LabelRecord} label
   */
  public handleOpenDeleteDialog = (label: LabelRecord): void => {
    this.deletingLabel = label;
    this.isDeleteDialogOpen = true;
  };

  /**
   * ラベル選択/非選択トグルハンドラー
   *
   * @param {number} [id]
   */
  public handleToggleLabel = (id?: number): void => {
    if (id !== undefined) {
      this.labelsController?.toggleLabel(id);
    }
  };

  /**
   * 選択中のすべてのラベルの選択状態を一括解除するハンドラー
   */
  public handleClearAllSelected = async (): Promise<void> => {
    await this.labelsController?.clearAllSelected();
  };

  /**
   * ラベル作成または更新の保存ハンドラー
   */
  public handleSaveLabel = async (): Promise<void> => {
    const trimmedName = this.inputName.trim();
    if (!trimmedName) return;

    if (this.editingLabel && this.editingLabel.id !== undefined) {
      await this.labelsController?.updateLabel(this.editingLabel.id, {
        name: trimmedName,
        description: this.inputDescription.trim(),
      });
    } else {
      await this.labelsController?.createLabel({
        name: trimmedName,
        description: this.inputDescription.trim(),
      });
    }

    this.isAddDialogOpen = false;
    this.editingLabel = null;
    this.inputName = "";
    this.inputDescription = "";
  };

  /**
   * ラベル削除の確定ハンドラー
   */
  public handleConfirmDelete = async (): Promise<void> => {
    if (this.deletingLabel && this.deletingLabel.id !== undefined) {
      await this.labelsController?.deleteLabel(this.deletingLabel.id);
    }
    this.isDeleteDialogOpen = false;
    this.deletingLabel = null;
  };

  /**
   * 新規作成/編集ダイアログを閉じるハンドラー
   */
  public handleCloseAddDialog = (): void => {
    this.isAddDialogOpen = false;
    this.editingLabel = null;
    this.inputName = "";
    this.inputDescription = "";
  };

  /**
   * 削除確認ダイアログを閉じるハンドラー
   */
  public handleCloseDeleteDialog = (): void => {
    this.isDeleteDialogOpen = false;
    this.deletingLabel = null;
  };

  /**
   * ラベル名入力ハンドラー
   *
   * @param {Event} e
   */
  public handleInputName = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    this.inputName = target.value;
  };

  /**
   * 説明文入力ハンドラー
   *
   * @param {Event} e
   */
  public handleInputDescription = (e: Event): void => {
    const target = e.target as HTMLTextAreaElement;
    this.inputDescription = target.value;
  };

  /**
   * ドロップダウンメニューの項目選択ハンドラー
   *
   * @private
   * @param {LabelRecord} label
   * @param {CustomEvent<{ item: { value: string } }>} e
   */
  private handleMenuSelect = (
    label: LabelRecord,
    e: CustomEvent<{ item: { value: string } }>,
  ): void => {
    const value = e.detail?.item?.value;
    if (value === "edit") {
      this.handleOpenEditDialog(label);
    } else if (value === "delete") {
      this.handleOpenDeleteDialog(label);
    }
  };

  /**
   * ラベルボタンのキーボード操作ハンドラー（Enter / Space で選択トグル）
   *
   * @param {KeyboardEvent} e
   * @param {number} [id]
   */
  public handleLabelKeyDown = (e: KeyboardEvent, id?: number): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.handleToggleLabel(id);
    }
  };

  /**
   * ラベルアイテムのメイン表示領域（アイコン・ラベル名）を描画する。
   *
   * @private
   * @param {LabelRecord} label ラベルレコード
   * @param {boolean} isActive 選択中かどうか
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  private renderLabelItemMain(
    label: LabelRecord,
    isActive: boolean,
  ): HTMLTemplateResult {
    return html`
      <div class="label-btn-main">
        <div class="label-icons">
          <wa-icon
            library="my-icons"
            name="tag-solid-full"
            class="label-button-icon"
          ></wa-icon>
          ${isActive
            ? html`
                <wa-icon
                  library="my-icons"
                  name="caret-right-solid-full"
                  class="label-button-icon type-caret"
                ></wa-icon>
              `
            : nothing}
        </div>
        <span class="label-button-text">${label.name}</span>
      </div>
    `;
  }

  /**
   * ラベルアイテムの操作メニュー（三点ドロップダウン）を描画する。
   *
   * @private
   * @param {LabelRecord} label ラベルレコード
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  private renderLabelItemDropdown(label: LabelRecord): HTMLTemplateResult {
    return html`
      <wa-dropdown
        class="label-menu-dropdown"
        placement="bottom-end"
        @click=${(e: Event) => e.stopPropagation()}
        @wa-select=${(e: CustomEvent<{ item: { value: string } }>) =>
          this.handleMenuSelect(label, e)}
      >
        <wa-button
          slot="trigger"
          class="btn-label-menu"
          variant="neutral"
          appearance="plain"
          size="s"
          aria-label="Label options"
        >
          <wa-icon
            library="my-icons"
            name="ellipsis-vertical-solid-full"
          ></wa-icon>
        </wa-button>
        <wa-dropdown-item value="edit">
          <wa-icon
            slot="icon"
            library="my-icons"
            name="pen-to-square-solid-full"
          ></wa-icon>
          編集
        </wa-dropdown-item>
        <wa-dropdown-item value="delete" variant="danger">
          <wa-icon
            slot="icon"
            library="my-icons"
            name="trash-solid-full"
          ></wa-icon>
          削除
        </wa-dropdown-item>
      </wa-dropdown>
    `;
  }

  /**
   * ラベルアイテム描画
   *
   * @private
   * @param {LabelRecord} label
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  private renderLabelItem(label: LabelRecord): HTMLTemplateResult {
    const isActive = label.isSelected;

    return html`
      <div
        class="label-btn ${isActive ? "is-active" : ""}"
        role="button"
        tabindex="0"
        @click=${() => this.handleToggleLabel(label.id)}
        @keydown=${(e: KeyboardEvent) => this.handleLabelKeyDown(e, label.id)}
      >
        ${this.renderLabelItemMain(label, isActive)}
        ${this.renderLabelItemDropdown(label)}
      </div>
    `;
  }

  /**
   * ヘッダー部（タイトルおよび追加/一括解除アクション）を描画する。
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <header class="section-header labels-header">
        <span class="section-title labels-title">LABELS</span>
        <div class="labels-header-actions">
          ${this.labelsController?.hasSelectedLabels
            ? html`
                <wa-tooltip for="btn-clear-labels" placement="bottom">
                  Clear Selection
                </wa-tooltip>
                <wa-button
                  id="btn-clear-labels"
                  class="btn-clear-labels"
                  variant="neutral"
                  appearance="plain"
                  size="s"
                  aria-label="Clear Selection"
                  @click=${this.handleClearAllSelected}
                >
                  <wa-icon
                    library="my-icons"
                    name="xmark-solid-full"
                  ></wa-icon>
                </wa-button>
              `
            : nothing}
          <wa-tooltip for="btn-add-label" placement="bottom">
            Add Label
          </wa-tooltip>
          <wa-button
            id="btn-add-label"
            class="btn-add-label"
            variant="neutral"
            appearance="plain"
            size="s"
            aria-label="Add Label"
            @click=${this.handleOpenAddDialog}
          >
            <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
          </wa-button>
        </div>
      </header>
    `;
  }

  /**
   * ラベル一覧コンテンツ部を描画する。
   *
   * @private
   * @param {readonly LabelRecord[]} labels
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  private renderContent(labels: readonly LabelRecord[]): HTMLTemplateResult {
    return html`
      <div class="labels-content">
        ${labels.length === 0
          ? html`<div class="empty-labels-message">ラベルがありません</div>`
          : labels.map((label) => this.renderLabelItem(label))}
      </div>
    `;
  }

  /**
   * 新規作成・編集ダイアログのフォームを描画する。
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  private renderAddEditForm(): HTMLTemplateResult {
    return html`
      <form
        class="dialog-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.handleSaveLabel();
        }}
      >
        <wa-input
          id="label-name"
          class="dialog-field"
          label="ラベル名"
          placeholder="例: プロジェクト、重要など"
          .value=${this.inputName}
          required
          @input=${this.handleInputName}
        ></wa-input>
        <wa-textarea
          id="label-description"
          class="dialog-field"
          label="説明（任意）"
          placeholder="ラベルの説明を入力"
          .value=${this.inputDescription}
          @input=${this.handleInputDescription}
        ></wa-textarea>
      </form>
    `;
  }

  /**
   * 新規作成・編集ダイアログを描画する。
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  private renderAddEditDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        id="label-dialog"
        .label=${this.editingLabel ? "ラベルの編集" : "ラベルの新規作成"}
        ?open=${this.isAddDialogOpen}
        @wa-after-hide=${this.handleCloseAddDialog}
      >
        ${this.renderAddEditForm()}
        <div slot="footer" class="dialog-footer">
          <wa-button
            variant="neutral"
            appearance="plain"
            @click=${this.handleCloseAddDialog}
          >
            キャンセル
          </wa-button>
          <wa-button
            variant="brand"
            ?disabled=${!this.inputName.trim()}
            @click=${this.handleSaveLabel}
          >
            保存
          </wa-button>
        </div>
      </wa-dialog>
    `;
  }

  /**
   * 削除確認ダイアログを描画する。
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  private renderDeleteDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        id="delete-dialog"
        label="ラベルの削除"
        ?open=${this.isDeleteDialogOpen}
        @wa-after-hide=${this.handleCloseDeleteDialog}
      >
        <div class="delete-dialog-message">
          ラベル「<strong>${this.deletingLabel?.name ??
          ""}</strong>」を削除してもよろしいですか？<br />
          ※この操作は取り消せません。
        </div>
        <div slot="footer" class="dialog-footer">
          <wa-button
            variant="neutral"
            appearance="plain"
            @click=${this.handleCloseDeleteDialog}
          >
            キャンセル
          </wa-button>
          <wa-button variant="danger" @click=${this.handleConfirmDelete}>
            削除
          </wa-button>
        </div>
      </wa-dialog>
    `;
  }

  /**
   * コンポーネント描画
   *
   * @override
   * @return {HTMLTemplateResult}
   * @memberof NavigationLabels
   */
  override render(): HTMLTemplateResult {
    const labels = this.labelsController?.state ?? [];

    return html`
      <div class="labels-container">
        <!-- 1. ヘッダー部 -->
        ${this.renderHeader()}

        <!-- 2. コンテンツ部 (スクロール可能) -->
        ${this.renderContent(labels)}

        <!-- 3. 新規登録・編集ダイアログ -->
        ${this.renderAddEditDialog()}

        <!-- 4. 削除確認ダイアログ -->
        ${this.renderDeleteDialog()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "navigation-labels": NavigationLabels;
  }
}
