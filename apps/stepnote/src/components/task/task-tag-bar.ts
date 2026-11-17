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
  TAG_VARIANT_LIST,
  DEFAULT_TAG_VARIANT,
} from "@/constants/tag.constants.js";
import type { TagRecord, TagVariant } from "@/db/models/tag.model.js";
import {
  SubscriberElement,
  WithTagsController,
  WithTagSetsController,
  WithTaskController,
} from "@/utils/controller-consumers.mixin.js";
import { normalizeTagName, normalizeTagVariant } from "@/utils/tag.utils.js";
import {
  canCreateNewTag,
  computeVisibleTagCount,
  filterTagsByKeyword,
} from "./task-tag-bar.utils.js";
import styles from "./task-tag-bar.scss?inline";

const ADD_BTN_RESERVED_WIDTH = 40;
const OVERFLOW_BTN_WIDTH = 38;
const TAG_LIST_GAP = 4;

/**
 * タスクペインヘッダー用タグ管理バー (TaskTagBar)
 *
 * タスクへ付与されたタグのチップ表示、横幅超過時の +N 省略＆ポップオーバー展開、
 * タグの付け外しおよび新規タグの作成＋即時付与を提供する。
 */
@customElement("task-tag-bar")
export class TaskTagBar extends WithTagSetsController(
  WithTagsController(WithTaskController(SubscriberElement)),
) {
  public static override styles = unsafeCSS(styles);

  /** 表示可能なタグ件数（undefined 時は自動計測または全件表示） */
  @property({ type: Number })
  public visibleTagCount?: number;

  /** ポップオーバー内検索／新規作成キーワード */
  @state()
  public searchKeyword: string = "";

  /** 新規作成タグの色バリアント */
  @state()
  public newTagVariant: TagVariant = DEFAULT_TAG_VARIANT;

  /** 新規作成タグの説明文 */
  @state()
  public newTagDescription: string = "";

  /** 選択中のタグセットID（文字列、未選択時は空文字） */
  @state()
  public selectedTagSetId: string = "";

  @state()
  private measuredVisibleCount?: number;

  private resizeObserver?: ResizeObserver;

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.recalculateVisibleCount();
      });
      this.resizeObserver.observe(this);
    }
  }

  override disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    super.disconnectedCallback();
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (this.visibleTagCount === undefined) {
      this.recalculateVisibleCount();
    }
  }

  /**
   * 現在選択中タスクに付与されたタグ一覧を取得する
   */
  public get assignedTags(): TagRecord[] {
    const tagIds = this.taskController?.state?.tagIds;
    if (!this.tagsController || !Array.isArray(tagIds) || tagIds.length === 0) {
      return [];
    }
    return this.tagsController.getTagsByIds(tagIds);
  }

  /**
   * コンテナ幅と隠し計測領域の各タグ幅から表示可能件数を再計算する
   */
  public recalculateVisibleCount = (): void => {
    if (this.visibleTagCount !== undefined || !this.renderRoot) {
      return;
    }
    const container =
      this.renderRoot.querySelector<HTMLElement>(".task-tag-bar");
    const measureItems = this.renderRoot.querySelectorAll<HTMLElement>(
      ".task-tag-bar__measure-item",
    );
    if (!container || container.clientWidth <= 0) {
      return;
    }
    const widths = Array.from(measureItems).map((el) => el.offsetWidth);
    const maxListWidth = Math.max(
      0,
      container.clientWidth - ADD_BTN_RESERVED_WIDTH,
    );
    const nextCount = computeVisibleTagCount(
      widths,
      maxListWidth,
      TAG_LIST_GAP,
      OVERFLOW_BTN_WIDTH,
    );
    if (this.measuredVisibleCount !== nextCount) {
      this.measuredVisibleCount = nextCount;
    }
  };

  /**
   * タスクからタグを削除するハンドラー
   */
  public handleRemoveTag = async (tagId?: number): Promise<void> => {
    if (tagId === undefined || !this.taskController) {
      return;
    }
    await this.taskController.removeTag(tagId);
  };

  /**
   * チェックボックス／項目操作でタグの付与・解除をトグルするハンドラー
   */
  public handleToggleTag = async (tagId?: number): Promise<void> => {
    if (tagId === undefined || !this.taskController) {
      return;
    }
    const currentIds = this.taskController.state?.tagIds ?? [];
    if (currentIds.includes(tagId)) {
      await this.taskController.removeTag(tagId);
    } else {
      await this.taskController.addTag(tagId);
    }
  };

  /**
   * 新規タグを作成して現在のタスクへ即座に付与するハンドラー
   */
  public handleCreateAndAttachTag = async (): Promise<void> => {
    const normalizedName = normalizeTagName(this.searchKeyword);
    const allTags = this.tagsController?.state ?? [];
    if (!this.tagsController || !canCreateNewTag(allTags, normalizedName)) {
      return;
    }

    const newTagId = await this.tagsController.createTag({
      name: normalizedName,
      variant: this.newTagVariant,
      description: this.newTagDescription.trim(),
    });
    await this.taskController?.addTag(newTagId);
    this.resetCreateForm();
  };

  /**
   * タグ追加ポップオーバーを閉じる
   */
  private closeAddPopover(): void {
    const popover = this.renderRoot?.querySelector<
      HTMLElement & { open?: boolean; hide?: () => Promise<void> | void }
    >(".task-tag-bar__add-popover");
    if (!popover) {
      return;
    }
    if (typeof popover.hide === "function") {
      void popover.hide();
    } else {
      popover.open = false;
    }
  }

  /**
   * 選択されたタグセット内の全タグを現在のタスクへマージ付与する
   */
  public handleApplyTagSet = async (): Promise<void> => {
    const setId = Number(this.selectedTagSetId);
    if (
      !this.selectedTagSetId ||
      !Number.isFinite(setId) ||
      !this.tagSetsController ||
      !this.taskController
    ) {
      return;
    }
    const tagSet = this.tagSetsController.getTagSetById(setId);
    if (!tagSet) {
      return;
    }
    const tagIdsToApply = [...tagSet.tagIds];
    this.selectedTagSetId = "";
    this.closeAddPopover();
    await this.taskController.addTags(tagIdsToApply);
  };

  /**
   * ポップオーバー内の入力状態をリセットする
   */
  public resetCreateForm = (): void => {
    this.searchKeyword = "";
    this.newTagVariant = DEFAULT_TAG_VARIANT;
    this.newTagDescription = "";
    this.selectedTagSetId = "";
  };

  /**
   * タグ追加ポップオーバー自身の閉鎖完了時のみ入力状態をリセットする
   * （子要素 wa-select 等からバブリングした wa-after-hide は無視する）
   */
  public handleAddPopoverAfterHide = (e: Event): void => {
    if (e.target !== e.currentTarget) {
      return;
    }
    this.resetCreateForm();
  };

  /**
   * 子要素の開閉系カスタムイベントが親ポップオーバーへ伝播するのを抑止する
   */
  private stopChildPopupEvent = (e: Event): void => {
    e.stopPropagation();
  };

  /**
   * 表示対象と省略対象のタグ数を算出する
   */
  private resolveDisplaySlice(tags: readonly TagRecord[]): {
    visibleTags: readonly TagRecord[];
    hiddenCount: number;
  } {
    const limit = this.visibleTagCount ?? this.measuredVisibleCount;
    if (limit === undefined || limit >= tags.length) {
      return { visibleTags: tags, hiddenCount: 0 };
    }
    const clamped = Math.max(0, limit);
    return {
      visibleTags: tags.slice(0, clamped),
      hiddenCount: tags.length - clamped,
    };
  }

  /**
   * タグチップ1件の描画
   */
  private renderTagChip(tag: TagRecord): HTMLTemplateResult {
    return html`
      <wa-tag
        class="task-tag-bar__tag"
        size="s"
        pill
        variant=${tag.variant}
        with-remove
        title=${tag.description || tag.name}
        @wa-remove=${() => this.handleRemoveTag(tag.id)}
      >
        ${tag.name}
      </wa-tag>
    `;
  }

  /**
   * 省略表示 (+N) ボタンおよび全タグ確認ポップオーバーの描画
   */
  private renderOverflowControl(
    assigned: readonly TagRecord[],
    hiddenCount: number,
  ): HTMLTemplateResult | typeof nothing {
    if (hiddenCount <= 0) {
      return nothing;
    }

    return html`
      <wa-button
        id="task-tag-bar-overflow-btn"
        class="task-tag-bar__overflow-btn"
        variant="neutral"
        appearance="outlined"
        size="xs"
        pill
        aria-label="すべてのタグを表示"
      >
        +${hiddenCount}
      </wa-button>
      <wa-popover
        for="task-tag-bar-overflow-btn"
        class="task-tag-bar__overflow-popover"
        placement="bottom-start"
      >
        <div class="task-tag-bar__popover-body">
          <div class="task-tag-bar__popover-header">
            付与中のタグ（${assigned.length}件）
          </div>
          <div class="task-tag-bar__overflow-list">
            ${assigned.map((tag) => this.renderTagChip(tag))}
          </div>
        </div>
      </wa-popover>
    `;
  }

  /**
   * ポップオーバー内の既存タグチェックリストの描画
   */
  private renderTagChecklist(
    filteredTags: readonly TagRecord[],
    assignedIdSet: ReadonlySet<number>,
  ): HTMLTemplateResult {
    if (filteredTags.length === 0) {
      return html`<div class="task-tag-bar__empty">
        一致するタグがありません
      </div>`;
    }

    return html`
      <div class="task-tag-bar__checklist">
        ${filteredTags.map((tag) => {
          const checked = tag.id !== undefined && assignedIdSet.has(tag.id);
          return html`
            <div class="task-tag-bar__check-item">
              <wa-checkbox
                size="s"
                class="task-tag-bar__checkbox"
                ?checked=${checked}
                @change=${() => this.handleToggleTag(tag.id)}
              >
                <wa-tag
                  size="xs"
                  pill
                  variant=${tag.variant}
                  title=${tag.description}
                >
                  ${tag.name}
                </wa-tag>
              </wa-checkbox>
            </div>
          `;
        })}
      </div>
    `;
  }

  /**
   * 新規タグのカラー選択セレクトを描画する
   */
  private renderVariantSelect(): HTMLTemplateResult {
    return html`
      <wa-select
        size="s"
        class="task-tag-bar__variant-select task-tag-bar__variant-select--${this
          .newTagVariant}"
        .value=${this.newTagVariant}
        @wa-show=${this.stopChildPopupEvent}
        @wa-after-show=${this.stopChildPopupEvent}
        @wa-hide=${this.stopChildPopupEvent}
        @wa-after-hide=${this.stopChildPopupEvent}
        @change=${(e: Event) => {
          const target = e.target as HTMLElement & { value?: string };
          this.newTagVariant = normalizeTagVariant(target.value);
        }}
      >
        ${TAG_VARIANT_LIST.map(
          (opt) => html`
            <wa-option
              class="task-tag-bar__variant-option task-tag-bar__variant-option--${opt.value}"
              value=${opt.value}
              >${opt.label}</wa-option
            >
          `,
        )}
      </wa-select>
    `;
  }

  /**
   * ポップオーバー内の新規タグ作成セクションの描画
   */
  private renderCreateTagSection(
    allTags: readonly TagRecord[],
  ): HTMLTemplateResult | typeof nothing {
    const normalized = normalizeTagName(this.searchKeyword);
    if (!canCreateNewTag(allTags, normalized)) {
      return nothing;
    }

    return html`
      <div class="task-tag-bar__create-section">
        <span class="task-tag-bar__create-title">
          新規タグ「#${normalized}」を作成
        </span>
        <wa-input
          size="s"
          class="task-tag-bar__desc-input"
          placeholder="説明（任意）"
          .value=${this.newTagDescription}
          @input=${(e: Event) => {
            this.newTagDescription = (e.target as HTMLInputElement).value;
          }}
        ></wa-input>
        <div class="task-tag-bar__create-row">
          ${this.renderVariantSelect()}
          <wa-button
            size="s"
            variant="brand"
            @click=${this.handleCreateAndAttachTag}
          >
            追加
          </wa-button>
        </div>
      </div>
    `;
  }

  /**
   * ポップオーバー内のタグセット一括追加セクションの描画
   */
  private renderTagSetSection(): HTMLTemplateResult | typeof nothing {
    const tagSets = this.tagSetsController?.state ?? [];
    if (tagSets.length === 0) {
      return nothing;
    }

    return html`
      <div class="task-tag-bar__tagset-section">
        <span class="task-tag-bar__create-title">タグセットから一括追加</span>
        <div class="task-tag-bar__tagset-row">
          <wa-select
            size="s"
            class="task-tag-bar__tagset-select"
            placeholder="セットを選択..."
            .value=${this.selectedTagSetId}
            @wa-show=${this.stopChildPopupEvent}
            @wa-after-show=${this.stopChildPopupEvent}
            @wa-hide=${this.stopChildPopupEvent}
            @wa-after-hide=${this.stopChildPopupEvent}
            @change=${(e: Event) => {
              const target = e.target as HTMLElement & { value?: string };
              this.selectedTagSetId = target.value ?? "";
            }}
          >
            ${tagSets.map(
              (set) => html`
                <wa-option value=${String(set.id ?? "")}>${set.name}</wa-option>
              `,
            )}
          </wa-select>
          <wa-button
            size="s"
            variant="brand"
            class="task-tag-bar__tagset-apply-btn"
            ?disabled=${!this.selectedTagSetId}
            @click=${this.handleApplyTagSet}
          >
            適用
          </wa-button>
        </div>
      </div>
    `;
  }

  /**
   * タグ検索／新規作成入力欄の描画
   */
  private renderAddSearchInput(): HTMLTemplateResult {
    return html`
      <wa-input
        size="s"
        class="task-tag-bar__search-input"
        placeholder="タグを検索または新規作成..."
        .value=${this.searchKeyword}
        @input=${(e: Event) => {
          this.searchKeyword = (e.target as HTMLInputElement).value;
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void this.handleCreateAndAttachTag();
          }
        }}
      ></wa-input>
    `;
  }

  /**
   * タグ追加・編集トリガーボタンおよびポップオーバーの描画
   */
  private renderAddControl(): HTMLTemplateResult {
    const allTags = this.tagsController?.state ?? [];
    const assignedIdSet = new Set(this.taskController?.state?.tagIds ?? []);
    const filteredTags = filterTagsByKeyword(allTags, this.searchKeyword);

    return html`
      <wa-tooltip for="task-tag-bar-add-btn" placement="bottom" trigger="hover">
        タグを追加・編集
      </wa-tooltip>
      <wa-button
        id="task-tag-bar-add-btn"
        class="task-tag-bar__btn-add"
        variant="neutral"
        appearance="plain"
        size="s"
        aria-label="タグを追加・編集"
      >
        <wa-icon
          library="my-icons"
          name="tags-solid-full"
          label="タグを追加・編集"
        ></wa-icon>
      </wa-button>
      <wa-popover
        for="task-tag-bar-add-btn"
        class="task-tag-bar__add-popover"
        placement="bottom-start"
        @wa-after-hide=${this.handleAddPopoverAfterHide}
      >
        <div class="task-tag-bar__popover-body">
          ${this.renderTagSetSection()} ${this.renderAddSearchInput()}
          ${this.renderTagChecklist(filteredTags, assignedIdSet)}
          ${this.renderCreateTagSection(allTags)}
        </div>
      </wa-popover>
    `;
  }

  /**
   * 幅計測用の非表示タグ一覧を描画する
   */
  private renderMeasureLayer(
    assigned: readonly TagRecord[],
  ): HTMLTemplateResult | typeof nothing {
    if (this.visibleTagCount !== undefined || assigned.length === 0) {
      return nothing;
    }
    return html`
      <div class="task-tag-bar__measure" aria-hidden="true">
        ${assigned.map(
          (tag) => html`
            <wa-tag
              class="task-tag-bar__measure-item"
              size="s"
              pill
              with-remove
            >
              ${tag.name}
            </wa-tag>
          `,
        )}
      </div>
    `;
  }

  override render(): HTMLTemplateResult {
    const assigned = this.assignedTags;
    const { visibleTags, hiddenCount } = this.resolveDisplaySlice(assigned);

    return html`
      <div class="task-tag-bar">
        ${this.renderMeasureLayer(assigned)}
        <div class="task-tag-bar__list">
          ${visibleTags.map((tag) => this.renderTagChip(tag))}
        </div>
        ${this.renderOverflowControl(assigned, hiddenCount)}
        ${this.renderAddControl()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-tag-bar": TaskTagBar;
  }
}
