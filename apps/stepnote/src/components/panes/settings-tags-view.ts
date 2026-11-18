import { html, nothing, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import {
  DEFAULT_TAG_VARIANT,
  TAG_VARIANT_LIST,
} from "@/constants/tag.constants.js";
import type { TagRecord, TagVariant } from "@/db/models/tag.model.js";
import {
  SubscriberElement,
  WithTagsController,
} from "@/utils/controller-consumers.mixin.js";
import {
  normalizeTagName,
  normalizeTagVariant,
  resolveWaTagVariant,
} from "@/utils/tag.utils.js";
import "./settings-tag-sets-view.js";
import styles from "./settings-tags-view.scss?inline";

export type TagsSubViewMode = "tags" | "tagSets";

/**
 * 設定画面用タグ管理コンポーネント (SettingsTagsView)
 *
 * タグの一覧表示、新規追加、編集（タグ名・色バリアント・説明文）、
 * および使用中タスク件数確認付きの削除機能を提供する。
 */
@customElement("settings-tags-view")
export class SettingsTagsView extends WithTagsController(SubscriberElement) {
  public static override styles = unsafeCSS(styles);

  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public editingTagId?: number;

  @state()
  public isCreatingNew: boolean = false;

  @state()
  public formName: string = "";

  @state()
  public formDescription: string = "";

  @state()
  public formVariant: TagVariant = DEFAULT_TAG_VARIANT;

  @state()
  public errorMessage: string = "";

  @state()
  public isDeleteDialogOpen: boolean = false;

  @state()
  public deletingTag?: TagRecord;

  @state()
  public deletingUsageCount: number = 0;

  @state()
  public activeSubView: TagsSubViewMode = "tags";

  /**
   * タグ管理／タグセット管理の表示モードを切り替える
   */
  public setSubView = (mode: TagsSubViewMode): void => {
    this.activeSubView = mode;
  };

  /**
   * 既存タグを選択して編集フォームを開く
   */
  public selectTag = (tag: TagRecord): void => {
    this.editingTagId = tag.id;
    this.isCreatingNew = false;
    this.formName = tag.name;
    this.formDescription = tag.description ?? "";
    this.formVariant = normalizeTagVariant(tag.variant);
    this.errorMessage = "";
  };

  /**
   * 新規タグ作成フォームを開始する
   */
  public startNewTag = (): void => {
    this.editingTagId = undefined;
    this.isCreatingNew = true;
    this.formName = "";
    this.formDescription = "";
    this.formVariant = DEFAULT_TAG_VARIANT;
    this.errorMessage = "";
  };

  /**
   * タグの保存（新規作成または更新）を実行する
   */
  public handleSave = async (): Promise<void> => {
    const trimmedName = normalizeTagName(this.formName);
    if (!trimmedName || !this.tagsController) {
      return;
    }
    this.errorMessage = "";

    try {
      if (this.isCreatingNew || this.editingTagId === undefined) {
        const newId = await this.tagsController.createTag({
          name: trimmedName,
          description: this.formDescription.trim(),
          variant: this.formVariant,
        });
        this.editingTagId = newId;
        this.isCreatingNew = false;
      } else {
        await this.tagsController.updateTag(this.editingTagId, {
          name: trimmedName,
          description: this.formDescription.trim(),
          variant: this.formVariant,
        });
      }
      this.formName = trimmedName;
      this.formDescription = this.formDescription.trim();
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : "タグの保存に失敗しました";
    }
  };

  /**
   * 削除対象タグの使用中タスク件数を取得して確認ダイアログを開く
   */
  public requestDeleteTag = async (tag: TagRecord): Promise<void> => {
    if (tag.id === undefined || !this.tagsController) {
      return;
    }
    this.deletingTag = tag;
    this.deletingUsageCount = await this.tagsController.getTagUsageCount(tag.id);
    this.isDeleteDialogOpen = true;
  };

  /**
   * 削除確認ダイアログを閉じる
   */
  public handleCloseDeleteDialog = (): void => {
    this.isDeleteDialogOpen = false;
    this.deletingTag = undefined;
    this.deletingUsageCount = 0;
  };

  /**
   * タグ削除を確定する
   */
  public handleConfirmDelete = async (): Promise<void> => {
    const targetId = this.deletingTag?.id;
    if (targetId === undefined || !this.tagsController) {
      this.handleCloseDeleteDialog();
      return;
    }

    await this.tagsController.deleteTag(targetId);
    if (this.editingTagId === targetId) {
      this.editingTagId = undefined;
      this.isCreatingNew = false;
      this.formName = "";
      this.formDescription = "";
      this.formVariant = DEFAULT_TAG_VARIANT;
    }
    this.handleCloseDeleteDialog();
  };

  /**
   * 一覧アイテム1件の描画
   */
  private renderMasterItem(tag: TagRecord): HTMLTemplateResult {
    const isSelected = this.editingTagId === tag.id && !this.isCreatingNew;
    const itemClass = isSelected
      ? "settings-tags-view__master-item settings-tags-view__master-item--selected"
      : "settings-tags-view__master-item";

    return html`
      <div
        class=${itemClass}
        role="button"
        tabindex="0"
        @click=${() => this.selectTag(tag)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.selectTag(tag);
          }
        }}
      >
        <div class="settings-tags-view__item-main">
          <div>
            <wa-tag
              size="s"
              pill
              appearance="filled"
              class="stepnote-tag stepnote-tag--${tag.variant}"
              variant=${resolveWaTagVariant(tag.variant)}
              >${tag.name}</wa-tag
            >
          </div>
          ${tag.description
            ? html`<span class="settings-tags-view__item-desc">${tag.description}</span>`
            : nothing}
        </div>
        <wa-button
          variant="danger"
          appearance="plain"
          size="s"
          title="タグを削除"
          aria-label="タグを削除"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            void this.requestDeleteTag(tag);
          }}
        >
          <wa-icon library="my-icons" name="trash-solid-full"></wa-icon>
        </wa-button>
      </div>
    `;
  }

  /**
   * 左ペイン（タグ一覧）の描画
   */
  private renderMasterPane(): HTMLTemplateResult {
    const tags = this.tagsController?.state ?? [];

    return html`
      <div class="settings-tags-view__master">
        <div class="settings-tags-view__master-header">
          <span class="settings-tags-view__master-title">タグ一覧</span>
          <wa-tooltip
            for="settings-tag-create-btn"
            placement="bottom"
            trigger="hover"
          >
            新規タグを作成
          </wa-tooltip>
          <wa-button
            id="settings-tag-create-btn"
            class="settings-tags-view__btn-new"
            variant="neutral"
            appearance="plain"
            size="s"
            aria-label="新規タグを作成"
            @click=${this.startNewTag}
          >
            <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
          </wa-button>
        </div>
        <div class="settings-tags-view__master-list">
          ${tags.length === 0
            ? html`<div class="settings-tags-view__empty">
                タグが登録されていません
              </div>`
            : tags.map((tag) => this.renderMasterItem(tag))}
        </div>
      </div>
    `;
  }

  /**
   * タグカラー選択セレクトを描画する
   */
  private renderVariantSelect(): HTMLTemplateResult {
    return html`
      <wa-select
        label="カラー"
        size="s"
        class="settings-tags-view__variant-select settings-tags-view__variant-select--${this
          .formVariant}"
        .value=${this.formVariant}
        @change=${(e: Event) => {
          const target = e.target as HTMLElement & { value?: string };
          this.formVariant = normalizeTagVariant(target.value);
        }}
      >
        ${TAG_VARIANT_LIST.map(
          (opt) => html`
            <wa-option
              class="settings-tags-view__variant-option settings-tags-view__variant-option--${opt.value}"
              value=${opt.value}
              >${opt.label}</wa-option
            >
          `,
        )}
      </wa-select>
    `;
  }

  /**
   * フォーム入力フィールド群の描画
   */
  private renderFormFields(): HTMLTemplateResult {
    const previewName = normalizeTagName(this.formName) || "プレビュー";

    return html`
      <div class="settings-tags-view__preview-row">
        <span class="settings-tags-view__preview-label">表示プレビュー:</span>
        <wa-tag
          size="s"
          pill
          appearance="filled"
          class="stepnote-tag stepnote-tag--${this.formVariant}"
          variant=${resolveWaTagVariant(this.formVariant)}
          >${previewName}</wa-tag
        >
      </div>
      <wa-input
        label="タグ名"
        size="s"
        placeholder="例: 緊急、API、レビュー待ち"
        .value=${this.formName}
        required
        @input=${(e: Event) => {
          this.formName = (e.target as HTMLInputElement).value;
          this.errorMessage = "";
        }}
      ></wa-input>
      ${this.renderVariantSelect()}
      <wa-textarea
        label="説明（任意）"
        size="s"
        placeholder="タグの用途や運用ルールを入力"
        .value=${this.formDescription}
        @input=${(e: Event) => {
          this.formDescription = (e.target as HTMLTextAreaElement).value;
        }}
      ></wa-textarea>
    `;
  }

  /**
   * 右ペイン（新規作成・編集フォーム）の描画
   */
  private renderDetailForm(): HTMLTemplateResult {
    const isSaveDisabled = !normalizeTagName(this.formName);
    const title = this.isCreatingNew ? "新規タグの作成" : "タグの編集";

    return html`
      <form
        class="settings-tags-view__form"
        @submit=${(e: Event) => {
          e.preventDefault();
          void this.handleSave();
        }}
      >
        <div class="settings-tags-view__form-header">
          <span class="settings-tags-view__form-title">${title}</span>
        </div>
        ${this.renderFormFields()}
        ${this.errorMessage
          ? html`<div class="settings-tags-view__error">${this.errorMessage}</div>`
          : nothing}
        <div class="settings-tags-view__form-actions">
          <wa-button
            variant="brand"
            size="s"
            type="submit"
            ?disabled=${isSaveDisabled}
          >
            保存
          </wa-button>
        </div>
      </form>
    `;
  }

  /**
   * 右ペインの描画
   */
  private renderDetailPane(): HTMLTemplateResult {
    const hasSelection = this.isCreatingNew || this.editingTagId !== undefined;

    return html`
      <div class="settings-tags-view__detail">
        ${hasSelection
          ? this.renderDetailForm()
          : html`
              <div class="settings-tags-view__empty">
                左の一覧からタグを選択するか、「＋」ボタンから新規作成してください。
              </div>
            `}
      </div>
    `;
  }

  /**
   * 削除確認ダイアログの描画
   */
  private renderDeleteDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        label="タグの削除確認"
        ?open=${this.isDeleteDialogOpen}
        @wa-after-hide=${this.handleCloseDeleteDialog}
      >
        <div class="settings-tags-view__dialog-body">
          タグ「<strong>${this.deletingTag?.name ?? ""}</strong>」を削除してもよろしいですか？<br />
          現在 <strong>${this.deletingUsageCount}件</strong> のタスクで使用されています。削除するとこれらのタスクからもタグが解除されます。
        </div>
        <div slot="footer" class="settings-tags-view__dialog-footer">
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

  /**
   * サブビュー切り替えバーの描画
   */
  private renderModeSwitch(): HTMLTemplateResult {
    return html`
      <div class="settings-tags-view__mode-switch">
        <wa-button-group label="タグ管理モード切り替え">
          <wa-button
            size="s"
            variant=${this.activeSubView === "tags" ? "brand" : "neutral"}
            appearance=${this.activeSubView === "tags" ? "accent" : "outlined"}
            @click=${() => this.setSubView("tags")}
          >
            タグ管理
          </wa-button>
          <wa-button
            size="s"
            variant=${this.activeSubView === "tagSets" ? "brand" : "neutral"}
            appearance=${this.activeSubView === "tagSets" ? "accent" : "outlined"}
            @click=${() => this.setSubView("tagSets")}
          >
            タグセット管理
          </wa-button>
        </wa-button-group>
      </div>
    `;
  }

  override render(): HTMLTemplateResult {
    return html`
      <div class="settings-tags-view__container">
        ${this.renderModeSwitch()}
        ${this.activeSubView === "tagSets"
          ? html`
              <settings-tag-sets-view
                class="settings-tags-view__subview"
                .theme=${this.theme}
              ></settings-tag-sets-view>
            `
          : html`
              <div class="settings-tags-view">
                ${this.renderMasterPane()}
                ${this.renderDetailPane()}
                ${this.renderDeleteDialog()}
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-tags-view": SettingsTagsView;
  }
}
