import "@awesome.me/webawesome/dist/styles/webawesome.css";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { registerWebAwesome } from "./webawesome";

registerWebAwesome();

/**
 * HubAddress Side Panel アプリケーションルートシェル（Phase 1 最小起動基盤）
 */
@customElement("hubaddress-app")
export class HubAddressApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background-color: var(--wa-color-surface-default);
      color: var(--wa-color-text-normal);
    }

    .app-header {
      display: flex;
      align-items: center;
      gap: var(--wa-space-xs);
      padding: var(--wa-space-s) var(--wa-space-m);
      border-bottom: var(--wa-border-width-s) solid
        var(--wa-color-surface-border);
    }

    .app-header__title {
      margin: 0;
      font-size: var(--wa-font-size-m);
      font-weight: var(--wa-font-weight-semibold);
    }

    .app-body {
      flex: 1;
      padding: var(--wa-space-m);
      overflow-y: auto;
    }
  `;

  override render() {
    return html`
      <header class="app-header">
        <wa-icon name="icon-hub-address"></wa-icon>
        <h1 class="app-header__title">HubAddress</h1>
      </header>
      <main class="app-body">
        <wa-callout variant="neutral">
          Side Panel 基盤の初期化が完了しました。
        </wa-callout>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hubaddress-app": HubAddressApp;
  }
}
