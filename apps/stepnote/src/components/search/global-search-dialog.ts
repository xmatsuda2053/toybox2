import { LitElement, html, unsafeCSS, type HTMLTemplateResult, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import "@shared/components";
import type { SearchInputEventDetail } from "@shared/components";
import { dispatchCustomEvent } from "@shared/utils";
import {
  taskListContext,
  quickAccessContext,
  labelsContext,
  taskContext,
} from "@/contexts/index.js";
import type { TaskListController } from "@/controllers/task-list.controller.js";
import type { QuickAccessController } from "@/controllers/quick-access.controller.js";
import type { LabelsController } from "@/controllers/labels.controller.js";
import type { TaskController } from "@/controllers/task.controller.js";
import { db } from "@/db/schema/database.schema.js";
import {
  GlobalSearchQuery,
  type GlobalSearchResultItem,
} from "@/db/queries/global-search.query.js";
import {
  TASK_STATUS_MAP,
  TASK_STATUS_ICON_MAP,
} from "@/constants/task-status.constants.js";
import { WithDialogBase } from "@/utils/dialog-element.mixin.js";
import styles from "./global-search-dialog.scss?inline";


/**
 * 全体検索モーダルダイアログコンポーネント (GlobalSearchDialog)
 *
 * 全年度・全タスク（完了タスク含む）を横断検索し、選択したタスクに応じて
 * Navigation（年度・QuickAccess・Label）および Task List を自動追従させる。
 *
 * @export
 * @class GlobalSearchDialog
 * @extends {WithDialogBase(LitElement)}
 */
@customElement("global-search-dialog")
export class GlobalSearchDialog extends WithDialogBase(LitElement) {
  public static override styles = unsafeCSS(styles);

  @consume({ context: taskListContext, subscribe: true })
  @property({ attribute: false })
  public taskListController?: TaskListController;

  @consume({ context: quickAccessContext, subscribe: true })
  @property({ attribute: false })
  public quickAccessController?: QuickAccessController;

  @consume({ context: labelsContext, subscribe: true })
  @property({ attribute: false })
  public labelsController?: LabelsController;

  @consume({ context: taskContext, subscribe: true })
  @property({ attribute: false })
  public taskController?: TaskController;

  public query: GlobalSearchQuery = new GlobalSearchQuery(db);

  @state()
  public results: GlobalSearchResultItem[] = [];

  @state()
  public searchKeyword = "";

  @state()
  public isSearching = false;

  @state()
  public selectedIndex = -1;

  /**
   * モーダルを閉じる処理
   */
  public handleClose = (): void => {
    this.selectedIndex = -1;
    this.closeDialog("global-search-close");
  };

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has("open") && this.open && this.searchKeyword.trim() !== "") {
      void this.executeSearch(this.searchKeyword);
    }
  }

  /**
   * 検索を実行し結果リストと選択状態を更新する
   */
  public executeSearch = async (keyword: string): Promise<void> => {
    const trimmed = keyword.trim();
    if (trimmed === "") {
      this.results = [];
      this.selectedIndex = -1;
      return;
    }

    this.isSearching = true;
    try {
      this.results = await this.query.search(trimmed);
      this.selectedIndex = -1;
    } finally {
      this.isSearching = false;
    }
  };

  /**
   * 検索入力ハンドラー
   */
  public handleSearchInput = async (
    event: CustomEvent<SearchInputEventDetail>,
  ): Promise<void> => {
    const rawKeyword = event.detail?.keyword ?? event.detail?.value ?? "";
    this.searchKeyword = rawKeyword;
    await this.executeSearch(rawKeyword);
  };

  /**
   * 検索結果タスクの選択ハンドラー（Navigation / TaskList 自動追従）
   */
  public handleSelectResult = async (
    item: GlobalSearchResultItem,
  ): Promise<void> => {
    const { task } = item;
    if (task.id === undefined) return;

    // 1. 年度同期
    if (this.taskListController && this.taskListController.fiscalYear !== task.fiscalYear) {
      await this.taskListController.setFiscalYear(task.fiscalYear);
    }

    // 2. QuickAccess同期（完了・対応中・開始待ちON、その他OFF）
    if (this.quickAccessController) {
      await this.quickAccessController.resetToAllStatus();
    }

    // 3. Labels同期
    if (this.labelsController) {
      await this.labelsController.selectLabel(task.labelId);
    }

    // 4. TaskList / Task 選択同期
    if (this.taskListController) {
      await this.taskListController.selectTask(task.id);
    }
    if (this.taskController) {
      await this.taskController.setTaskId(task.id);
    }

    this.open = false;
    dispatchCustomEvent(this, "global-search-select", { detail: item });
  };

  /**
   * キーボード操作（矢印上下での移動、Enterで確定）
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex =
        this.selectedIndex === -1
          ? 0
          : (this.selectedIndex + 1) % this.results.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex =
        this.selectedIndex <= 0
          ? this.results.length - 1
          : this.selectedIndex - 1;
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (this.selectedIndex >= 0 && this.selectedIndex < this.results.length) {
        const target = this.results[this.selectedIndex];
        if (target) {
          this.handleSelectResult(target);
        }
      }
    }
  };

  /**
   * 検索入力部を描画する
   */
  private renderSearchInput(): HTMLTemplateResult {
    return html`
      <div class="global-search-dialog__search">
        <search-input
          class="global-search-dialog__search-input"
          size="m"
          placeholder="全タスク・課題・ノート・ログを検索... (Escで閉じる)"
          .value=${this.searchKeyword}
          @search-input=${this.handleSearchInput}
        ></search-input>
      </div>
    `;
  }

  /**
   * 単一の検索結果アイテムを描画する
   */
  private renderResultItem(
    item: GlobalSearchResultItem,
    index: number,
  ): HTMLTemplateResult {
    const isSelected = index === this.selectedIndex;
    const statusDef = TASK_STATUS_MAP[item.task.statusCode];
    const statusLabel = statusDef?.labelJa ?? "不明";
    const statusIcon =
      TASK_STATUS_ICON_MAP[item.task.statusCode] ?? "circle-stop-solid-full";
    const statusClass =
      item.task.statusCode === 9
        ? "done"
        : item.task.statusCode === 5
          ? "progress"
          : "pending";

    return html`
      <div
        class="global-search-dialog__item ${isSelected ? "global-search-dialog__item--selected" : ""}"
        @click=${() => this.handleSelectResult(item)}
      >
        <div class="global-search-dialog__item-header">
          <div class="global-search-dialog__item-title-wrapper">
            <wa-icon
              class="global-search-dialog__status-icon global-search-dialog__status-icon--${statusClass}"
              library="my-icons"
              name=${statusIcon}
              label=${statusLabel}
            ></wa-icon>
            <span class="global-search-dialog__item-title">${item.task.name}</span>
          </div>
          <div class="global-search-dialog__item-badges">
            ${item.labelName
              ? html`<wa-badge
                  class="global-search-dialog__badge global-search-dialog__badge--label"
                  variant="brand"
                >${item.labelName}</wa-badge>`
              : ""}
            <wa-badge
              class="global-search-dialog__badge global-search-dialog__badge--year"
              variant="neutral"
            >${item.task.fiscalYear}年度</wa-badge>
          </div>
        </div>

        ${this.renderSnippets(item)}
      </div>
    `;
  }


  /**
   * マッチしたスニペット一覧を描画する
   */
  private renderSnippets(item: GlobalSearchResultItem): HTMLTemplateResult {
    if (!item.snippets || item.snippets.length === 0) return html``;

    return html`
      <div class="global-search-dialog__snippets">
        ${item.snippets.map(
          (snippet) => html`
            <div class="global-search-dialog__snippet">
              <span class="global-search-dialog__snippet-label">${snippet.sourceLabel}</span>
              <span class="global-search-dialog__snippet-text">${snippet.snippet}</span>
            </div>
          `,
        )}
      </div>
    `;
  }

  /**
   * 結果コンテンツ（結果一覧またはガイダンス）を描画する
   */
  private renderContent(): HTMLTemplateResult {
    if (this.searchKeyword === "") {
      return html`
        <div class="global-search-dialog__guidance">
          キーワードを入力して、全年度のタスク・課題・ノート・ログを横断検索します
        </div>
      `;
    }

    if (this.results.length === 0) {
      return html`
        <div class="global-search-dialog__empty">
          一致するタスクは見つかりませんでした
        </div>
      `;
    }

    return html`
      <div class="global-search-dialog__results">
        ${this.results.map((item, idx) => this.renderResultItem(item, idx))}
      </div>
    `;
  }

  /**
   * フッター操作ガイドを描画する
   */
  private renderFooterGuide(): HTMLTemplateResult {
    return html`
      <div slot="footer" class="global-search-dialog__footer-guide">
        <div class="global-search-dialog__key-hints">
          <span><span class="global-search-dialog__key-badge">↑</span> <span class="global-search-dialog__key-badge">↓</span> 移動</span>
          <span><span class="global-search-dialog__key-badge">Enter</span> 選択</span>
          <span><span class="global-search-dialog__key-badge">Esc</span> 閉じる</span>
        </div>
        <div>${this.results.length} 件見つかりました</div>
      </div>
    `;
  }

  override render(): HTMLTemplateResult {
    return html`
      <wa-dialog
        label="全体検索 (Omnisearch)"
        ?open=${this.open}
        @wa-after-hide=${this.handleClose}
        @keydown=${this.handleKeyDown}
      >
        <div class="global-search-dialog">
          ${this.renderSearchInput()}
          ${this.renderContent()}
        </div>
        ${this.renderFooterGuide()}
      </wa-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "global-search-dialog": GlobalSearchDialog;
  }
}
