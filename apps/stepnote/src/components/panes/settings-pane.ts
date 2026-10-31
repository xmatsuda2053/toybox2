import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import styles from "./settings-pane.scss?inline";

/**
 * 全画面設定モード専用ペインコンポーネント (SettingsPane)
 *
 * アプリケーション全体のグローバル設定をカテゴリ別タブ（wa-tab-group[placement="start"]）で
 * 管理・表示するための全画面ペイン領域を提供する。
 *
 * @export
 * @class SettingsPane
 * @extends {LitElement}
 */
@customElement("settings-pane")
export class SettingsPane extends LitElement {
  public static override styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  /**
   * 現在アクティブな設定カテゴリタブ名
   */
  @state()
  public activeTab: string = "general";

  /**
   * タブ切り替えイベントハンドラー
   *
   * @param {CustomEvent<{ name: string }>} e
   * @memberof SettingsPane
   */
  public handleTabShow = (e: CustomEvent<{ name: string }>): void => {
    const tabName = e.detail?.name;
    if (tabName !== "general" && tabName !== "appearance") {
      return;
    }
    this.activeTab = tabName;
  };

  /**
   * ヘッダー部の描画
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof SettingsPane
   */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <div class="settings-pane__header">
        <span class="settings-pane__title">SETTINGS</span>
      </div>
    `;
  }

  /**
   * 設定カテゴリタブグループの描画
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof SettingsPane
   */
  private renderTabGroup(): HTMLTemplateResult {
    return html`
      <wa-tab-group
        class="settings-pane__tab-group"
        placement="start"
        active=${this.activeTab}
        @wa-tab-show=${this.handleTabShow}
      >
        <wa-tab slot="nav" panel="general">General</wa-tab>
        <wa-tab slot="nav" panel="appearance">Appearance</wa-tab>

        <wa-tab-panel name="general" class="settings-pane__tab-panel">
          <div class="settings-pane__placeholder">General settings</div>
        </wa-tab-panel>

        <wa-tab-panel name="appearance" class="settings-pane__tab-panel">
          <div class="settings-pane__placeholder">Appearance settings</div>
        </wa-tab-panel>
      </wa-tab-group>
    `;
  }

  /**
   * メインコンテンツ部（周囲余白付きタブグループ領域）の描画
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof SettingsPane
   */
  private renderContent(): HTMLTemplateResult {
    return html`
      <div class="settings-pane__content">${this.renderTabGroup()}</div>
    `;
  }

  /**
   * メインレンダリング
   *
   * @return {HTMLTemplateResult}
   * @memberof SettingsPane
   */
  public override render(): HTMLTemplateResult {
    return html`
      <div class="settings-pane">
        ${this.renderHeader()} ${this.renderContent()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-pane": SettingsPane;
  }
}

