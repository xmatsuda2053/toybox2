import { html, unsafeCSS, type HTMLTemplateResult, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import "@/components/logs/logs-view.js";
import styles from "./journal-pane.scss?inline";

/**
 * ジャーナルエリア（第5ペイン）コンテナコンポーネント (JournalPane)
 *
 * 画面第5ペインを担当し、課題（Issues）、メモ（Notes）、および作業記録（Logs）の
 * 3つのタブコンテナを提供する。
 *
 * @export
 * @class JournalPane
 * @extends {LitElement}
 */
@customElement("journal-pane")
export class JournalPane extends LitElement {
  public static styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public activeTab: string = "notes";

  /**
   * タブ切り替えハンドラー
   */
  public handleTabShow = (e: CustomEvent<{ name: string }>): void => {
    const tabName = e.detail?.name;
    if (tabName) {
      this.activeTab = tabName;
    }
  };

  /**
   * ヘッダー部の描画
   */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <div class="journal-pane__header">
        <span class="journal-pane__title">JOURNAL</span>
      </div>
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
        <wa-tab slot="nav" panel="notes">Notes</wa-tab>
        <wa-tab slot="nav" panel="logs">Logs</wa-tab>

        <wa-tab-panel name="notes" class="journal-pane__tab-panel">
          <div class="journal-pane__placeholder">Notes Content (準備中)</div>
        </wa-tab-panel>

        <wa-tab-panel name="logs" class="journal-pane__tab-panel">
          <logs-view
            .theme=${this.theme}
            data-theme=${this.theme}
          ></logs-view>
        </wa-tab-panel>
      </wa-tab-group>
    `;
  }

  /**
   * メインレンダリング
   */
  public render(): HTMLTemplateResult {
    return html`
      <div class="journal-pane">
        ${this.renderHeader()}
        ${this.renderTabGroup()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "journal-pane": JournalPane;
  }
}
