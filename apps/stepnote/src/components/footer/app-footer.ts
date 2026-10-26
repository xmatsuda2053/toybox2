import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import appFooterStyles from "./app-footer.scss?inline";
import { formatStorageSize, getStorageEstimate } from "./app-footer.utils.js";

/**
 * StepNote フッターコンポーネント (AppFooter)
 *
 * 画面最下部に位置し、データ保全・ストレージインジケーター（アイデア1）、
 * タスク進捗サマリー（アイデア2）、ショートカットヘルプ（アイデア5）を提供するステータスバー。
 *
 * @export
 * @class AppFooter
 * @extends {LitElement}
 */
@customElement("app-footer")
export class AppFooter extends LitElement {
  public static override styles = unsafeCSS(appFooterStyles);

  /**
   * 推定ストレージ使用量（バイト単位）
   */
  @property({ type: Number })
  public storageUsage?: number;

  /**
   * コンポーネントが DOM に接続された際のライフサイクルコールバック。
   */
  public override connectedCallback(): void {
    super.connectedCallback();
    void this.updateStorageUsage();
  }

  /**
   * ストレージ使用量を取得する（テストでモック・スパイ可能）。
   *
   * @returns 推定ストレージ使用量（bytes）
   */
  public async fetchStorageUsage(): Promise<number | undefined> {
    return getStorageEstimate();
  }

  /**
   * ストレージ使用量を非同期に取得してプロパティへ反映する。
   */
  public async updateStorageUsage(): Promise<void> {
    const usage = await this.fetchStorageUsage();
    if (usage !== undefined) {
      this.storageUsage = usage;
    }
  }

  /**
   * 左ゾーン（コンテキスト・サマリー・データ保全）のレンダリング。
   */
  protected renderContextZone() {
    const formattedStorage = formatStorageSize(this.storageUsage);

    return html`
      <div class="app-footer__context">
        <span
          id="footer-status-saved"
          class="app-footer__status-item app-footer__status-item--saved"
        >
          <wa-icon
            library="my-icons"
            name="circle-check-solid-full"
            class="app-footer__icon app-footer__icon--success"
          ></wa-icon>
          <span class="app-footer__text">Saved</span>
        </span>
        <wa-tooltip
          for="footer-status-saved"
          placement="top"
          trigger="hover"
        >
          データはローカルのIndexedDBに自動保存されています
        </wa-tooltip>
        <span class="app-footer__divider">|</span>
        <span
          id="footer-status-storage"
          class="app-footer__status-item app-footer__status-item--storage"
        >
          <wa-icon
            library="my-icons"
            name="database-solid-full"
            class="app-footer__icon"
          ></wa-icon>
          <span class="app-footer__text">${formattedStorage}</span>
        </span>
        <wa-tooltip
          for="footer-status-storage"
          placement="top"
          trigger="hover"
        >
          IndexedDBの推定ストレージ使用量
        </wa-tooltip>
        <slot name="context"></slot>
      </div>
    `;
  }

  /**
   * 中央ゾーン（アクティブタスク・タイマー）のレンダリング。
   */
  protected renderCenterZone() {
    return html`
      <div class="app-footer__center">
        <slot name="center"></slot>
      </div>
    `;
  }

  /**
   * 右ゾーン（システム状態・ショートカットヘルプ）のレンダリング。
   */
  protected renderSystemZone() {
    return html`
      <div class="app-footer__system">
        <slot name="system"></slot>
      </div>
    `;
  }

  public override render() {
    return html`
      <footer class="app-footer">
        ${this.renderContextZone()}
        ${this.renderCenterZone()}
        ${this.renderSystemZone()}
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-footer": AppFooter;
  }
}
