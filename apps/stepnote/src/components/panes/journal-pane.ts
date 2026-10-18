import { html, unsafeCSS, nothing, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import {
  SubscriberElement,
  WithTaskController,
  WithLayoutUIController,
  WithScratchController,
} from "@/utils/controller-consumers.mixin.js";
import "@/components/logs/logs-view.js";
import "@/components/notes/notes-view.js";
import styles from "./journal-pane.scss?inline";

/**
 * ジャーナルエリア（第5ペイン）コンテナコンポーネント (JournalPane)
 *
 * 画面第5ペインを担当し、作業記録（Logs）およびアプリ共通メモ（Scratch）の
 * タブコンテナを提供する。
 *
 * @export
 * @class JournalPane
 * @extends {WithScratchController(WithLayoutUIController(WithTaskController(SubscriberElement)))}
 */
@customElement("journal-pane")
export class JournalPane extends WithScratchController(
  WithLayoutUIController(WithTaskController(SubscriberElement)),
) {
  public static styles = unsafeCSS(styles);

  /**
   * ジャーナルエリアの開閉・縮小状態（Props指定優先、未指定時はlayoutUIControllerから取得）
   */
  @property({ type: Boolean })
  public isJournalAreaOpen?: boolean;

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public activeTab: string = "logs";

  /**
   * ジャーナルエリアの開閉状態を解決する。
   */
  public get isJournalOpen(): boolean {
    if (this.isJournalAreaOpen !== undefined) {
      return this.isJournalAreaOpen;
    }
    return this.layoutUIController?.state.isJournalAreaOpen ?? true;
  }

  /**
   * タブ切り替えハンドラー（表示タブの更新および子コンポーネントのプレビューモード初期化）
   */
  public handleTabShow = (e: CustomEvent<{ name: string }>): void => {
    const tabName = e.detail?.name;
    if (tabName !== "logs" && tabName !== "scratch") {
      return;
    }
    this.activeTab = tabName;
    const targetTag = tabName === "logs" ? "logs-view" : "notes-view";
    const targetEl = this.renderRoot?.querySelector(targetTag) as
      | (HTMLElement & { resetModesToPreview?: () => void })
      | null;
    targetEl?.resetModesToPreview?.();
  };

  /**
   * ジャーナルエリアの開閉・縮小状態を切り替える。
   */
  public handleToggleJournalArea = (): void => {
    this.layoutUIController?.toggleJournalArea();
  };

  /**
   * Logs パネル未選択時の空状態テンプレート描画
   */
  private renderEmptyLogs(): HTMLTemplateResult {
    return html`
      <div class="journal-pane__empty">
        <span>タスクが選択されていません</span>
      </div>
    `;
  }

  /**
   * ヘッダー部の描画
   */
  private renderHeader(): HTMLTemplateResult {
    const isOpen = this.isJournalOpen;
    const toggleTooltip = isOpen ? "ジャーナルを閉じる" : "ジャーナルを開く";

    return html`
      <div class="journal-pane__header">
        ${isOpen
          ? html`<span class="journal-pane__title">JOURNAL</span>`
          : nothing}
        <div class="journal-pane__actions">
          <wa-tooltip for="journal-pane-toggle-btn" placement="left">
            ${toggleTooltip}
          </wa-tooltip>
          <wa-button
            id="journal-pane-toggle-btn"
            class="journal-pane__toggle-btn"
            variant="neutral"
            appearance="plain"
            size="s"
            @click=${this.handleToggleJournalArea}
          >
            <wa-icon
              library="my-icons"
              name="chevron-right"
              class="journal-pane__toggle-icon ${isOpen ? "is-open" : "is-closed"}"
              label=${toggleTooltip}
            ></wa-icon>
          </wa-button>
        </div>
      </div>
    `;
  }

  /**
   * Logs パネルの描画
   */
  private renderLogsPanel(): HTMLTemplateResult {
    const task = this.taskController?.state;
    return html`
      <wa-tab-panel name="logs" class="journal-pane__tab-panel">
        ${task
          ? html`
              <logs-view
                .theme=${this.theme}
                data-theme=${this.theme}
              ></logs-view>
            `
          : this.renderEmptyLogs()}
      </wa-tab-panel>
    `;
  }

  /**
   * Scratch パネルの描画
   */
  private renderScratchPanel(): HTMLTemplateResult {
    return html`
      <wa-tab-panel name="scratch" class="journal-pane__tab-panel">
        <notes-view
          .theme=${this.theme}
          data-theme=${this.theme}
          .showTabId=${false}
          .controller=${this.scratchController}
        ></notes-view>
      </wa-tab-panel>
    `;
  }

  /**
   * タブ領域の描画
   */
  private renderTabGroup(): HTMLTemplateResult {
    return html`
      <wa-tab-group
        class="journal-pane__tab-group"
        active=${this.activeTab}
        @wa-tab-show=${this.handleTabShow}
      >
        <wa-tab slot="nav" panel="logs">Logs</wa-tab>
        <wa-tab slot="nav" panel="scratch">Scratch</wa-tab>

        ${this.renderLogsPanel()}
        ${this.renderScratchPanel()}
      </wa-tab-group>
    `;
  }

  /**
   * メインレンダリング
   */
  public render(): HTMLTemplateResult {
    const isOpen = this.isJournalOpen;
    const rootClass = isOpen
      ? "journal-pane"
      : "journal-pane journal-pane--collapsed";

    return html`
      <div class="${rootClass}">
        ${this.renderHeader()}
        ${isOpen ? this.renderTabGroup() : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "journal-pane": JournalPane;
  }
}
