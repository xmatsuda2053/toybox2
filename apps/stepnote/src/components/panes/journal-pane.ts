import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import {
  SubscriberElement,
  WithTaskController,
} from "@/utils/controller-consumers.mixin.js";
import "@/components/logs/logs-view.js";
import styles from "./journal-pane.scss?inline";

/**
 * ジャーナルエリア（第5ペイン）コンテナコンポーネント (JournalPane)
 *
 * 画面第5ペインを担当し、作業記録（Logs）のタブコンテナを提供する。
 *
 * @export
 * @class JournalPane
 * @extends {WithTaskController(SubscriberElement)}
 */
@customElement("journal-pane")
export class JournalPane extends WithTaskController(SubscriberElement) {
  public static styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public activeTab: string = "logs";

  /**
   * タブ切り替えハンドラー（表示タブの更新および子コンポーネントのプレビューモード初期化）
   */
  public handleTabShow = (e: CustomEvent<{ name: string }>): void => {
    const tabName = e.detail?.name;
    if (tabName === "logs") {
      this.activeTab = tabName;
      const targetEl = this.renderRoot?.querySelector("logs-view") as
        | (HTMLElement & { resetModesToPreview?: () => void })
        | null;
      targetEl?.resetModesToPreview?.();
    }
  };

  /**
   * 空状態テンプレートの描画
   */
  private renderEmptyState(): HTMLTemplateResult {
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
        <wa-tab slot="nav" panel="logs">Logs</wa-tab>

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
    const task = this.taskController?.state;
    if (!task) {
      return this.renderEmptyState();
    }

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
