import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import { SubscriberElement } from "@/utils/controller-consumers.mixin.js";
import "./settings-templates-view.js";
import "./settings-tags-view.js";
import "./settings-auto-export-view.js";
import "./settings-history-view.js";
import styles from "./settings-pane.scss?inline";

/**
 * 全画面設定モード専用ペインコンポーネント (SettingsPane)
 *
 * アプリケーション設定タブシェルとして各機能サブビューを統合管理する。
 */
@customElement("settings-pane")
export class SettingsPane extends SubscriberElement {
  public static override styles = unsafeCSS(styles);

  /** カラーテーマ ("light" | "dark") */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  /** 現在アクティブな設定タブ名 */
  @state()
  public activeTab: string = "templates";

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
        <wa-tab slot="nav" panel="tags">Tags</wa-tab>
        <wa-tab slot="nav" panel="auto-export">Auto Export</wa-tab>
        <wa-tab slot="nav" panel="history">History</wa-tab>
        <wa-tab-panel name="templates" class="settings-pane__tab-panel" active>
          <settings-templates-view .theme=${this.theme}></settings-templates-view>
        </wa-tab-panel>
        <wa-tab-panel name="tags" class="settings-pane__tab-panel">
          <settings-tags-view .theme=${this.theme}></settings-tags-view>
        </wa-tab-panel>
        <wa-tab-panel name="auto-export" class="settings-pane__tab-panel">
          <settings-auto-export-view></settings-auto-export-view>
        </wa-tab-panel>
        <wa-tab-panel name="history" class="settings-pane__tab-panel">
          <settings-history-view></settings-history-view>
        </wa-tab-panel>
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
