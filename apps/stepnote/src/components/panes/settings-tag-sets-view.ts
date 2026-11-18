import { html, nothing, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import "@shared/components";
import type { TagRecord, TagSetRecord } from "@/db/models/tag.model.js";
import {
  SubscriberElement,
  WithTagsController,
  WithTagSetsController,
} from "@/utils/controller-consumers.mixin.js";
import {
  normalizeTagIds,
  normalizeTagSetName,
  resolveWaTagVariant,
} from "@/utils/tag.utils.js";
import styles from "./settings-tag-sets-view.scss?inline";

/**
 * 設定画面用タグセット管理コンポーネント (SettingsTagSetsView)
 *
 * タグセットの一覧表示、新規追加、編集（セット名・説明・含めるタグ複数選択）、
 * および削除確認ダイアログ付き削除機能を提供する。
 */
@customElement("settings-tag-sets-view")
export class SettingsTagSetsView extends WithTagsController(
  WithTagSetsController(SubscriberElement),
) {
  public static override styles = unsafeCSS(styles);

  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public editingTagSetId?: number;

  @state()
  public isCreatingNew: boolean = false;

  @state()
  public formName: string = "";

  @state()
  public formDescription: string = "";

  @state()
  public formTagIds: number[] = [];

  @state()
  public errorMessage: string = "";

  @state()
  public isDeleteDialogOpen: boolean = false;

  @state()
  public deletingTagSet?: TagSetRecord;

  /**
   * 既存タグセットを選択して編集フォームを開く
   */
  public selectTagSet = (tagSet: TagSetRecord): void => {
    this.editingTagSetId = tagSet.id;
    this.isCreatingNew = false;
    this.formName = tagSet.name;
    this.formDescription = tagSet.description ?? "";
    this.formTagIds = normalizeTagIds(tagSet.tagIds);
    this.errorMessage = "";
  };

  /**
   * 新規タグセット作成フォームを開始する
   */
  public startNewTagSet = (): void => {
    this.editingTagSetId = undefined;
    this.isCreatingNew = true;
    this.formName = "";
    this.formDescription = "";
    this.formTagIds = [];
    this.errorMessage = "";
  };

  /**
   * 編集フォーム内のタグ選択状態を切り替える
   */
  public toggleFormTag = (tagId: number): void => {
    if (this.formTagIds.includes(tagId)) {
      this.formTagIds = this.formTagIds.filter((id) => id !== tagId);
    } else {
      this.formTagIds = [...this.formTagIds, tagId];
    }
  };

  /**
   * タグセットの保存（新規作成または更新）を実行する
   */
  public handleSave = async (): Promise<void> => {
    const trimmedName = normalizeTagSetName(this.formName);
    if (!trimmedName || !this.tagSetsController) {
      return;
    }
    this.errorMessage = "";

    try {
      await this.persistTagSet(trimmedName);
    } catch (error) {
      this.errorMessage =
        error instanceof Error
          ? error.message
          : "タグセットの保存に失敗しました";
    }
  };

  /**
   * 作成または更新をコントローラへ永続化する
   */
  private async persistTagSet(name: string): Promise<void> {
    const payload = {
      name,
      description: this.formDescription.trim(),
      tagIds: normalizeTagIds(this.formTagIds),
    };
    if (this.isCreatingNew) {
      const createdId = await this.tagSetsController!.createTagSet(payload);
      this.editingTagSetId = createdId;
      this.isCreatingNew = false;
      return;
    }
    if (this.editingTagSetId !== undefined) {
      await this.tagSetsController!.updateTagSet(this.editingTagSetId, payload);
    }
  }

  /**
   * 削除確認ダイアログを開く
   */
  public requestDeleteTagSet = (tagSet: TagSetRecord): void => {
    this.deletingTagSet = tagSet;
    this.isDeleteDialogOpen = true;
  };

  /**
   * 削除確認ダイアログを閉じる
   */
  public handleCloseDeleteDialog = (): void => {
    this.isDeleteDialogOpen = false;
    this.deletingTagSet = undefined;
  };

  /**
   * タグセット削除を実行する
   */
  public handleConfirmDelete = async (): Promise<void> => {
    const targetId = this.deletingTagSet?.id;
    if (targetId === undefined || !this.tagSetsController) {
      this.handleCloseDeleteDialog();
      return;
    }

    await this.tagSetsController.deleteTagSet(targetId);
    if (this.editingTagSetId === targetId) {
      this.editingTagSetId = undefined;
      this.isCreatingNew = false;
    }
    this.handleCloseDeleteDialog();
  };

  /**
   * 一覧行内のタグバッジプレビューを描画する
   */
  private renderItemTagBadges(
    tags: readonly TagRecord[],
  ): HTMLTemplateResult | typeof nothing {
    if (tags.length === 0) {
      return nothing;
    }
    return html`
      <div class="settings-tag-sets-view__item-tags">
        ${tags.map(
          (tag) =>
            html`<wa-tag
              size="xs"
              pill
              appearance="filled"
              class="stepnote-tag stepnote-tag--${tag.variant}"
              variant=${resolveWaTagVariant(tag.variant)}
              >${tag.name}</wa-tag
            >`,
        )}
      </div>
    `;
  }

  /**
   * 左ペインの一覧アイテム1行分を描画する
   */
  private renderMasterItem(tagSet: TagSetRecord): HTMLTemplateResult {
    const isSelected =
      this.editingTagSetId === tagSet.id && !this.isCreatingNew;
    const itemClass = isSelected
      ? "settings-tag-sets-view__master-item settings-tag-sets-view__master-item--selected"
      : "settings-tag-sets-view__master-item";
    const resolvedTags = this.tagsController?.getTagsByIds(tagSet.tagIds) ?? [];

    return html`
      <div
        class=${itemClass}
        role="button"
        tabindex="0"
        @click=${() => this.selectTagSet(tagSet)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.selectTagSet(tagSet);
          }
        }}
      >
        <div class="settings-tag-sets-view__item-main">
          <span class="settings-tag-sets-view__item-title">${tagSet.name}</span>
          ${this.renderItemTagBadges(resolvedTags)}
          ${tagSet.description
            ? html`<span class="settings-tag-sets-view__item-desc">${tagSet.description}</span>`
            : nothing}
        </div>
        <wa-button
          variant="danger"
          appearance="plain"
          size="s"
          title="タグセットを削除"
          aria-label="タグセットを削除"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            this.requestDeleteTagSet(tagSet);
          }}
        >
          <wa-icon library="my-icons" name="trash-solid-full"></wa-icon>
        </wa-button>
      </div>
    `;
  }

  /**
   * 左ペイン（タグセット一覧）の描画
   */
  private renderMasterPane(): HTMLTemplateResult {
    const tagSets = this.tagSetsController?.state ?? [];

    return html`
      <div class="settings-tag-sets-view__master">
        <div class="settings-tag-sets-view__master-header">
          <span class="settings-tag-sets-view__master-title">タグセット一覧</span>
          <wa-tooltip
            for="settings-tagset-create-btn"
            placement="bottom"
            trigger="hover"
          >
            新規タグセットを作成
          </wa-tooltip>
          <wa-button
            id="settings-tagset-create-btn"
            class="settings-tag-sets-view__btn-new"
            variant="neutral"
            appearance="plain"
            size="s"
            aria-label="新規タグセットを作成"
            @click=${this.startNewTagSet}
          >
            <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
          </wa-button>
        </div>
        <div class="settings-tag-sets-view__master-list">
          ${tagSets.length === 0
            ? html`<div class="settings-tag-sets-view__empty">
                タグセットが登録されていません
              </div>`
            : tagSets.map((set) => this.renderMasterItem(set))}
        </div>
      </div>
    `;
  }

  /**
   * セットに含めるタグのチェックボックス一覧を描画する
   */
  private renderTagSelectionField(): HTMLTemplateResult {
    const allTags = this.tagsController?.state ?? [];
    const selectedSet = new Set(this.formTagIds);

    return html`
      <div class="settings-tag-sets-view__tag-selector">
        <span class="settings-tag-sets-view__field-label">含めるタグ</span>
        <div class="settings-tag-sets-view__tag-list">
          ${allTags.length === 0
            ? html`<span class="settings-tag-sets-view__tag-hint">
                タグ管理から先にタグを登録してください
              </span>`
            : allTags.map((tag) => {
                const tagId = tag.id;
                const checked = tagId !== undefined && selectedSet.has(tagId);
                return html`
                  <div class="settings-tag-sets-view__tag-item">
                    <wa-checkbox
                      size="s"
                      class="settings-tag-sets-view__tag-checkbox"
                      .checked=${live(checked)}
                      @change=${() => {
                        if (tagId !== undefined) this.toggleFormTag(tagId);
                      }}
                    >
                      <wa-tag
                        size="xs"
                        pill
                        appearance="filled"
                        class="stepnote-tag stepnote-tag--${tag.variant}"
                        variant=${resolveWaTagVariant(tag.variant)}
                        >${tag.name}</wa-tag
                      >
                    </wa-checkbox>
                  </div>
                `;
              })}
        </div>
      </div>
    `;
  }

  /**
   * フォーム入力フィールド群の描画
   */
  private renderFormFields(): HTMLTemplateResult {
    return html`
      <wa-input
        label="タグセット名"
        size="s"
        placeholder="例: リリース前チェック、定例対応"
        .value=${this.formName}
        required
        @input=${(e: Event) => {
          this.formName = (e.target as HTMLInputElement).value;
          this.errorMessage = "";
        }}
      ></wa-input>
      ${this.renderTagSelectionField()}
      <wa-textarea
        label="説明（任意）"
        size="s"
        placeholder="タグセットの用途を入力"
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
    const isSaveDisabled = !normalizeTagSetName(this.formName);
    const title = this.isCreatingNew
      ? "新規タグセットの作成"
      : "タグセットの編集";

    return html`
      <form
        class="settings-tag-sets-view__form"
        @submit=${(e: Event) => {
          e.preventDefault();
          void this.handleSave();
        }}
      >
        <div class="settings-tag-sets-view__form-header">
          <span class="settings-tag-sets-view__form-title">${title}</span>
        </div>
        ${this.renderFormFields()}
        ${this.errorMessage
          ? html`<div class="settings-tag-sets-view__error">${this.errorMessage}</div>`
          : nothing}
        <div class="settings-tag-sets-view__form-actions">
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
    const hasSelection =
      this.isCreatingNew || this.editingTagSetId !== undefined;

    return html`
      <div class="settings-tag-sets-view__detail">
        ${hasSelection
          ? this.renderDetailForm()
          : html`
              <div class="settings-tag-sets-view__empty">
                左の一覧からタグセットを選択するか、「＋」ボタンから新規作成してください。
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
        label="タグセットの削除確認"
        ?open=${this.isDeleteDialogOpen}
        @wa-after-hide=${this.handleCloseDeleteDialog}
      >
        <div class="settings-tag-sets-view__dialog-body">
          タグセット「<strong>${this.deletingTagSet?.name ?? ""}</strong>」を削除してもよろしいですか？<br />
          ※ 既にタスクへ付与されている個別のタグは削除されません。
        </div>
        <div slot="footer" class="settings-tag-sets-view__dialog-footer">
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

  override render(): HTMLTemplateResult {
    return html`
      <div class="settings-tag-sets-view">
        ${this.renderMasterPane()}
        ${this.renderDetailPane()}
        ${this.renderDeleteDialog()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-tag-sets-view": SettingsTagSetsView;
  }
}
