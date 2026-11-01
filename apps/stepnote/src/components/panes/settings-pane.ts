import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import type { MarkdownDisplayMode } from "@shared/components";
import {
  SubscriberElement,
  WithTaskTemplateController,
} from "@/utils/controller-consumers.mixin.js";
import {
  reorderTemplateIssues,
  isTemplateDirty,
} from "@/utils/task-template.utils.js";
import { extractIssueTitle } from "@/utils/task-filter.utils.js";
import type {
  TaskTemplateRecord,
  TaskTemplateIssue,
} from "@/db/models/template.model.js";
import styles from "./settings-pane.scss?inline";

/**
 * 全画面設定モード専用ペインコンポーネント (SettingsPane)
 *
 * アプリケーション設定およびタスクテンプレートのマスター・ディテール管理UIを提供する。
 *
 * @export
 * @class SettingsPane
 * @extends {WithTaskTemplateController(SubscriberElement)}
 */
@customElement("settings-pane")
export class SettingsPane extends WithTaskTemplateController(
  SubscriberElement,
) {
  public static override styles = unsafeCSS(styles);

  /** カラーテーマ ("light" | "dark") */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  /** 現在アクティブな設定タブ名 */
  @state()
  public activeTab: string = "templates";

  /** 編集中のテンプレートID（未選択時 undefined） */
  @state()
  public editingTemplateId?: number;

  /** フォーム状態: テンプレート名 */
  @state()
  public formName: string = "";

  /** フォーム状態: 概要（Markdown） */
  @state()
  public formDescription: string = "";

  /** 概要Markdownの表示モード */
  @state()
  public descMode: MarkdownDisplayMode = "edit";

  /** フォーム状態: Issue一覧 */
  @state()
  public formIssues: TaskTemplateIssue[] = [];

  /** 選択中Issueのインデックス */
  @state()
  public selectedIssueIndex: number = 0;

  /** Issue本文Markdownの表示モード */
  @state()
  public issueDescMode: MarkdownDisplayMode = "edit";

  /** 新規作成中フラグ */
  @state()
  public isCreatingNew: boolean = false;

  /** 編集元テンプレート（未保存判定用） */
  @state()
  public originalTemplate?: TaskTemplateRecord;

  /**
   * フォームに入力・編集された内容に変更（未保存差分）があるかどうか
   */
  public get isDirty(): boolean {
    const original =
      this.originalTemplate ??
      this.taskTemplateController?.state.find(
        (t) => t.id === this.editingTemplateId,
      );
    return isTemplateDirty(
      {
        name: this.formName,
        description: this.formDescription,
        issues: this.formIssues,
      },
      original,
    );
  }

  /**
   * テンプレートを選択して編集を開始する
   */
  public selectTemplate(template: TaskTemplateRecord): void {
    this.editingTemplateId = template.id;
    this.originalTemplate = template;
    this.formName = template.name;
    this.formDescription = template.description;
    this.descMode = template.description?.trim() ? "preview" : "edit";
    this.formIssues = (template.issues ?? []).map((issue) => ({ ...issue }));
    this.selectedIssueIndex = 0;
    this.issueDescMode = "edit";
    this.isCreatingNew = false;
  }

  /**
   * 編集対象のIssueを選択する
   */
  public selectIssue = (index: number): void => {
    this.selectedIssueIndex = index;
    this.issueDescMode = "edit";
  };

  /**
   * 新規テンプレート作成フォームを開始する
   */
  public startNewTemplate = (): void => {
    this.editingTemplateId = undefined;
    this.originalTemplate = undefined;
    this.formName = "";
    this.formDescription = "";
    this.descMode = "edit";
    this.formIssues = [];
    this.selectedIssueIndex = 0;
    this.issueDescMode = "edit";
    this.isCreatingNew = true;
  };

  /**
   * テンプレートの保存ハンドラー
   */
  public handleSave = async (): Promise<void> => {
    if (!this.formName.trim() || !this.taskTemplateController) {
      return;
    }

    const payload = {
      name: this.formName.trim(),
      description: this.formDescription,
      issues: this.formIssues,
    };

    if (this.isCreatingNew || this.editingTemplateId === undefined) {
      const newId = await this.taskTemplateController.createTemplate(payload);
      this.editingTemplateId = newId;
      this.isCreatingNew = false;
      this.originalTemplate = {
        id: newId,
        ...payload,
      };
    } else {
      await this.taskTemplateController.updateTemplate(
        this.editingTemplateId,
        payload,
      );
      this.originalTemplate = {
        id: this.editingTemplateId,
        ...payload,
      };
    }
  };

  /**
   * テンプレート複製ハンドラー
   */
  public handleClone = async (id: number): Promise<void> => {
    if (!this.taskTemplateController) return;
    const clonedId = await this.taskTemplateController.cloneTemplate(id);
    const cloned = this.taskTemplateController.state.find(
      (t) => t.id === clonedId,
    );
    if (cloned) {
      this.selectTemplate(cloned);
    }
  };

  /**
   * テンプレート削除ハンドラー
   */
  public handleDelete = async (id: number): Promise<void> => {
    if (!this.taskTemplateController) return;
    await this.taskTemplateController.deleteTemplate(id);
    if (this.editingTemplateId === id) {
      this.editingTemplateId = undefined;
      this.isCreatingNew = false;
    }
  };

  /**
   * テンプレートメニュー操作ハンドラー
   */
  public handleMenuSelect = async (
    action: string,
    id: number,
  ): Promise<void> => {
    if (action === "clone") {
      await this.handleClone(id);
    } else if (action === "delete") {
      await this.handleDelete(id);
    }
  };

  /**
   * Issue追加ハンドラー
   */
  public addIssue = (): void => {
    const nextOrder = this.formIssues.length + 1;
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `tpl-iss-${Date.now()}-${Math.random()}`;

    this.formIssues = [
      ...this.formIssues,
      {
        id,
        order: nextOrder,
        value: "### New Issue",
        dayOffset: this.formIssues.length,
      },
    ];
    this.selectedIssueIndex = this.formIssues.length - 1;
    this.issueDescMode = "edit";
  };

  /**
   * Issue削除ハンドラー
   */
  public removeIssue = (index: number): void => {
    const next = this.formIssues.filter((_, idx) => idx !== index);
    this.formIssues = next.map((iss, idx) => ({ ...iss, order: idx + 1 }));
    this.selectedIssueIndex = Math.min(
      this.selectedIssueIndex,
      Math.max(0, this.formIssues.length - 1),
    );
  };

  /**
   * Issueを1つ上に移動
   */
  public moveIssueUp = (index: number): void => {
    this.formIssues = reorderTemplateIssues(this.formIssues, index, index - 1);
    if (this.selectedIssueIndex === index) {
      this.selectedIssueIndex = index - 1;
    } else if (this.selectedIssueIndex === index - 1) {
      this.selectedIssueIndex = index;
    }
  };

  /**
   * Issueを1つ下に移動
   */
  public moveIssueDown = (index: number): void => {
    this.formIssues = reorderTemplateIssues(this.formIssues, index, index + 1);
    if (this.selectedIssueIndex === index) {
      this.selectedIssueIndex = index + 1;
    } else if (this.selectedIssueIndex === index + 1) {
      this.selectedIssueIndex = index;
    }
  };

  /**
   * Issueドロップダウンメニュー選択ハンドラー
   */
  public handleIssueMenuSelect = (action: string, index: number): void => {
    if (action === "move-up") {
      this.moveIssueUp(index);
    } else if (action === "move-down") {
      this.moveIssueDown(index);
    } else if (action === "delete") {
      this.removeIssue(index);
    }
  };

  /**
   * Issueアイテムのキーボード操作ハンドラー（Enter / Space で選択）
   */
  public handleIssueItemKeyDown = (
    e: KeyboardEvent,
    index: number,
  ): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.selectIssue(index);
    }
  };

  /**
   * Issue本文変更ハンドラー
   */
  public handleIssueValueChange = (index: number, value: string): void => {
    this.formIssues = this.formIssues.map((iss, idx) =>
      idx === index ? { ...iss, value } : iss,
    );
  };

  /**
   * Issue相対オフセット日数変更ハンドラー
   */
  public handleIssueOffsetChange = (index: number, dayOffset: number): void => {
    this.formIssues = this.formIssues.map((iss, idx) =>
      idx === index ? { ...iss, dayOffset } : iss,
    );
  };

  /**
   * ヘッダー部の描画
   */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <div class="settings-pane__header">
        <span class="settings-pane__title">SETTINGS</span>
      </div>
    `;
  }

  /**
   * テンプレートアイテムのキーボード操作ハンドラー（Enter / Space で選択）
   */
  public handleMasterItemKeyDown = (
    e: KeyboardEvent,
    template: TaskTemplateRecord,
  ): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.selectTemplate(template);
    }
  };

  /**
   * マスターペイン（テンプレート一覧アイテム）の描画
   */
  private renderMasterItem(t: TaskTemplateRecord): HTMLTemplateResult {
    const isSelected = this.editingTemplateId === t.id && !this.isCreatingNew;
    const itemClass = isSelected
      ? "settings-pane__master-item settings-pane__master-item--selected"
      : "settings-pane__master-item";

    return html`
      <div
        class="${itemClass}"
        role="button"
        tabindex="0"
        @click=${() => this.selectTemplate(t)}
        @keydown=${(e: KeyboardEvent) => this.handleMasterItemKeyDown(e, t)}
      >
        <div class="settings-pane__item-main">
          <span class="settings-pane__item-title">${t.name}</span>
        </div>
        <wa-dropdown
          class="settings-pane__item-dropdown"
          placement="bottom-end"
          @click=${(e: MouseEvent) => e.stopPropagation()}
          @wa-select=${(e: CustomEvent<{ item: { value: string } }>) => {
            e.stopPropagation();
            if (t.id !== undefined) {
              this.handleMenuSelect(e.detail.item.value, t.id);
            }
          }}
        >
          <wa-button
            slot="trigger"
            class="settings-pane__btn-menu"
            variant="neutral"
            appearance="plain"
            size="small"
            title="メニュー"
            aria-label="Template options"
          >
            <wa-icon library="my-icons" name="bars-solid-full"></wa-icon>
          </wa-button>
          <wa-dropdown-item value="clone">
            <wa-icon slot="icon" library="my-icons" name="copy-solid-full"></wa-icon>
            複製
          </wa-dropdown-item>
          <wa-dropdown-item value="delete" variant="danger">
            <wa-icon slot="icon" library="my-icons" name="trash-solid-full"></wa-icon>
            削除
          </wa-dropdown-item>
        </wa-dropdown>
      </div>
    `;
  }

  /**
   * マスターペイン（一覧領域）の描画
   */
  private renderMasterPane(): HTMLTemplateResult {
    const templates = this.taskTemplateController?.state ?? [];

    return html`
      <div class="settings-pane__master">
        <div class="settings-pane__master-header">
          <span class="settings-pane__master-title">テンプレート一覧</span>
          <wa-tooltip
            for="settings-template-create-btn"
            placement="bottom"
            trigger="hover"
          >
            新規テンプレートを作成
          </wa-tooltip>
          <wa-button
            id="settings-template-create-btn"
            class="settings-pane__btn-new"
            variant="neutral"
            appearance="plain"
            size="small"
            title="新規テンプレートを作成"
            aria-label="新規テンプレートを作成"
            @click=${this.startNewTemplate}
          >
            <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
          </wa-button>
        </div>
        <div class="settings-pane__master-list">
          ${templates.map((t) => this.renderMasterItem(t))}
        </div>
      </div>
    `;
  }

  /**
   * テンプレート保存ボタンの描画
   */
  private renderSaveButton(): HTMLTemplateResult {
    const isSaveDisabled = !this.formName.trim();
    const dirty = this.isDirty;
    const saveButtonVariant = dirty ? "brand" : "neutral";
    const saveButtonAppearance = dirty ? "accent" : "plain";
    const saveButtonClass = `settings-pane__btn-save${dirty ? " settings-pane__btn-save--dirty" : ""}`;
    const tooltipText = dirty
      ? "未保存の変更があります（クリックして保存）"
      : "テンプレートを保存";

    return html`
      <wa-tooltip
        for="settings-template-save-btn"
        placement="bottom"
        trigger="hover"
      >
        ${tooltipText}
      </wa-tooltip>
      <wa-button
        id="settings-template-save-btn"
        class="${saveButtonClass}"
        variant="${saveButtonVariant}"
        appearance="${saveButtonAppearance}"
        size="medium"
        title="${tooltipText}"
        aria-label="${tooltipText}"
        ?disabled=${isSaveDisabled}
        @click=${this.handleSave}
      >
        ${dirty
          ? html`<wa-icon
              library="my-icons"
              name="floppy-disk-regular-full"
              label="${tooltipText}"
              animation="shake"
            ></wa-icon>`
          : html`<wa-icon
              library="my-icons"
              name="floppy-disk-regular-full"
              label="${tooltipText}"
            ></wa-icon>`}
      </wa-button>
    `;
  }

  /**
   * Issueドロップダウンメニューの描画
   */
  private renderIssueItemDropdown(
    index: number,
    isFirst: boolean,
    isLast: boolean,
  ): HTMLTemplateResult {
    return html`
      <wa-dropdown
        class="settings-pane__issue-dropdown"
        @wa-select=${(e: CustomEvent) =>
          this.handleIssueMenuSelect(e.detail.item.value, index)}
      >
        <wa-button
          slot="trigger"
          class="settings-pane__btn-menu"
          variant="neutral"
          appearance="plain"
          size="small"
          aria-label="Issueメニュー"
          title="Issueメニュー"
          @click=${(e: Event) => e.stopPropagation()}
          @keydown=${(e: Event) => e.stopPropagation()}
        >
          <wa-icon library="my-icons" name="bars-solid-full"></wa-icon>
        </wa-button>
        <wa-dropdown-item value="move-up" ?disabled=${isFirst}>
          <wa-icon slot="icon" library="my-icons" name="angle-up-solid-full"></wa-icon>
          上へ移動
        </wa-dropdown-item>
        <wa-dropdown-item value="move-down" ?disabled=${isLast}>
          <wa-icon slot="icon" library="my-icons" name="angle-down-solid-full"></wa-icon>
          下へ移動
        </wa-dropdown-item>
        <wa-dropdown-item value="delete">
          <wa-icon slot="icon" library="my-icons" name="trash-solid-full"></wa-icon>
          削除
        </wa-dropdown-item>
      </wa-dropdown>
    `;
  }

  /**
   * Issueリストアイテムの描画
   */
  private renderIssueMasterItem(
    issue: TaskTemplateIssue,
    index: number,
  ): HTMLTemplateResult {
    const isSelected = this.selectedIssueIndex === index;
    const itemClass = isSelected
      ? "settings-pane__issue-item settings-pane__issue-item--selected"
      : "settings-pane__issue-item";
    const isFirst = index === 0;
    const isLast = index === this.formIssues.length - 1;
    const displayTitle = extractIssueTitle(issue.value);

    return html`
      <div
        class="${itemClass}"
        role="button"
        tabindex="0"
        @click=${() => this.selectIssue(index)}
        @keydown=${(e: KeyboardEvent) => this.handleIssueItemKeyDown(e, index)}
      >
        <div class="settings-pane__item-main">
          <span class="settings-pane__item-title">${displayTitle}</span>
        </div>
        ${this.renderIssueItemDropdown(index, isFirst, isLast)}
      </div>
    `;
  }

  /**
   * Issueマスター領域（左側リスト）の描画
   */
  private renderIssueMaster(): HTMLTemplateResult {
    return html`
      <div class="settings-pane__issue-master">
        <div class="settings-pane__issue-master-header">
          <span class="settings-pane__section-label">登録Issue一覧</span>
          <wa-tooltip
            for="settings-issue-add-btn"
            placement="bottom"
            trigger="hover"
          >
            Issueを追加
          </wa-tooltip>
          <wa-button
            id="settings-issue-add-btn"
            class="settings-pane__btn-add-issue"
            variant="neutral"
            appearance="plain"
            size="small"
            title="Issueを追加"
            aria-label="Issueを追加"
            @click=${this.addIssue}
          >
            <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
          </wa-button>
        </div>
        <div class="settings-pane__issue-list">
          ${this.formIssues.map((issue, index) =>
            this.renderIssueMasterItem(issue, index),
          )}
        </div>
      </div>
    `;
  }

  /**
   * Issueディテール領域（右側エディタ・日数設定）の描画
   */
  private renderIssueDetail(): HTMLTemplateResult {
    const currentIssue = this.formIssues[this.selectedIssueIndex];
    if (!currentIssue) {
      return html`
        <div class="settings-pane__issue-detail">
          <div class="settings-pane__placeholder">
            Issueが登録されていません。「＋」ボタンから追加してください。
          </div>
        </div>
      `;
    }

    const themeMode = this.theme === "dark" ? "dark" : "light";

    return html`
      <div class="settings-pane__issue-detail">
        <markdown-editor-preview
          class="settings-pane__issue-editor"
          .titleText=${`#${currentIssue.order} Issue本文`}
          .value=${currentIssue.value}
          .mode=${this.issueDescMode}
          .themeMode=${themeMode}
          .darkTheme=${"soft"}
          @mode-change=${(e: CustomEvent<{ mode: MarkdownDisplayMode }>) => {
            this.issueDescMode = e.detail?.mode ?? "edit";
          }}
          @markdown-change=${(e: CustomEvent<{ value: string }>) => {
            this.handleIssueValueChange(
              this.selectedIssueIndex,
              e.detail?.value ?? "",
            );
          }}
        ></markdown-editor-preview>

        <div class="settings-pane__issue-offset-row">
          <span class="settings-pane__issue-offset-label">タスク期日からの日数:</span>
          <wa-input
            type="number"
            size="small"
            class="settings-pane__issue-offset-input"
            .value=${String(currentIssue.dayOffset)}
            @input=${(e: Event) =>
              this.handleIssueOffsetChange(
                this.selectedIssueIndex,
                Number((e.target as HTMLInputElement).value),
              )}
          ></wa-input>
          <span class="settings-pane__issue-offset-unit">日後</span>
        </div>
      </div>
    `;
  }

  /**
   * Issue一覧編集セクション（左右分割）の描画
   */
  private renderIssueSection(): HTMLTemplateResult {
    return html`
      <div class="settings-pane__issue-section">
        ${this.renderIssueMaster()}
        ${this.renderIssueDetail()}
      </div>
    `;
  }

  /**
   * 詳細編集フォームの描画
   */
  private renderDetailForm(): HTMLTemplateResult {
    const themeMode = this.theme === "dark" ? "dark" : "light";

    return html`
      <div class="settings-pane__form">
        <div class="settings-pane__name-row">
          <wa-input
            class="settings-pane__form-name"
            label="テンプレート名"
            placeholder="テンプレートの名称を入力"
            .value=${this.formName}
            required
            @input=${(e: Event) => {
              this.formName = (e.target as HTMLInputElement).value;
            }}
          ></wa-input>
          ${this.renderSaveButton()}
        </div>

        <div class="settings-pane__form-body">
          <div class="settings-pane__desc-container">
            <markdown-editor-preview
              class="settings-pane__desc-editor"
              .titleText=${"タスク概要"}
              .value=${this.formDescription}
              .mode=${this.descMode}
              .themeMode=${themeMode}
              .darkTheme=${"soft"}
              @mode-change=${(e: CustomEvent<{ mode: MarkdownDisplayMode }>) => {
                this.descMode = e.detail?.mode ?? "edit";
              }}
              @markdown-change=${(e: CustomEvent<{ value: string }>) => {
                this.formDescription = e.detail?.value ?? "";
              }}
            ></markdown-editor-preview>
          </div>

          ${this.renderIssueSection()}
        </div>
      </div>
    `;
  }

  /**
   * ディテールペイン（詳細領域）の描画
   */
  private renderDetailPane(): HTMLTemplateResult {
    const hasSelection = this.isCreatingNew || this.editingTemplateId !== undefined;

    return html`
      <div class="settings-pane__detail">
        ${hasSelection
          ? this.renderDetailForm()
          : html`
              <div class="settings-pane__placeholder">
                左の一覧からテンプレートを選択するか、「新規作成」をクリックしてください。
              </div>
            `}
      </div>
    `;
  }

  /**
   * テンプレート管理タブパネルの描画
   */
  private renderTemplatePanel(): HTMLTemplateResult {
    return html`
      <wa-tab-panel name="templates" class="settings-pane__tab-panel" active>
        <div class="settings-pane__master-detail">
          ${this.renderMasterPane()}
          ${this.renderDetailPane()}
        </div>
      </wa-tab-panel>
    `;
  }

  /**
   * タブグループの描画
   */
  private renderTabGroup(): HTMLTemplateResult {
    return html`
      <wa-tab-group
        class="settings-pane__tab-group"
        placement="start"
        active=${this.activeTab}
      >
        <wa-tab slot="nav" panel="templates">Templates</wa-tab>
        ${this.renderTemplatePanel()}
      </wa-tab-group>
    `;
  }

  /**
   * メインレンダリング
   */
  public override render(): HTMLTemplateResult {
    return html`
      <div class="settings-pane">
        ${this.renderHeader()}
        <div class="settings-pane__content">
          ${this.renderTabGroup()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-pane": SettingsPane;
  }
}
