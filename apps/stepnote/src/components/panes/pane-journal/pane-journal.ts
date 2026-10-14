import { html, unsafeCSS, type HTMLTemplateResult, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import "./journal-logs.js";
import styles from "./pane-journal.scss?inline";

/**
 * ジャーナルエリア（第5ペイン）コンテナコンポーネント (PaneJournal)
 *
 * 画面第5ペインを担当し、作業記録（Logs）およびメモ（Notes）の
 * 2つのタブコンテナを提供する。
 *
 * @export
 * @class PaneJournal
 * @extends {LitElement}
 */
@customElement("pane-journal")
export class PaneJournal extends LitElement {
  public static styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public activeTab: string = "logs";

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
      <div class="pane-journal__header">
        <span class="pane-journal__title">JOURNAL</span>
      </div>
    `;
  }

  /**
   * タブ領域の描画
   */
  private renderTabGroup(): HTMLTemplateResult {
    return html`
      <wa-tab-group
        class="pane-journal__tab-group"
        active=${this.activeTab}
        @wa-tab-show=${this.handleTabShow}
      >
        <wa-tab slot="nav" panel="logs">Logs</wa-tab>
        <wa-tab slot="nav" panel="notes">Notes</wa-tab>

        <wa-tab-panel name="logs" class="pane-journal__tab-panel">
          <journal-logs
            .theme=${this.theme}
            data-theme=${this.theme}
          ></journal-logs>
        </wa-tab-panel>

        <wa-tab-panel name="notes" class="pane-journal__tab-panel">
          <div class="pane-journal__placeholder">Notes Content (準備中)</div>
        </wa-tab-panel>
      </wa-tab-group>
    `;
  }

  /**
   * メインレンダリング
   */
  public render(): HTMLTemplateResult {
    return html`
      <div class="pane-journal">
        ${this.renderHeader()}
        ${this.renderTabGroup()}
      </div>
    `;
  }
}
