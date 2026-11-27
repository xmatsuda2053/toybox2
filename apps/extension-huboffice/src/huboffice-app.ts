import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { HubOfficeController } from "./controllers/huboffice.controller";
import { renderHomeView } from "./components/home-view";
import { renderSettingsView } from "./components/settings-view";
import "./tools/wareki-converter/wareki-converter-tool";
import "./tools/qr-generator/qr-generator-tool";
import shellStyles from "./huboffice-app.scss?inline";
import homeStyles from "./components/home-view.scss?inline";
import settingsStyles from "./components/settings-view.scss?inline";

/**
 * HubOffice Side Panel アプリケーションルートコンポーネント
 */
@customElement("huboffice-app")
export class HubOfficeApp extends LitElement {
  static styles = [
    unsafeCSS(shellStyles),
    unsafeCSS(homeStyles),
    unsafeCSS(settingsStyles),
  ];

  readonly controller = new HubOfficeController(this);

  private renderTopBarLeft(): TemplateResult {
    const { activeView, activeTool } = this.controller;

    if (activeView === "home") {
      return html`
        <div class="huboffice-shell__title-group">
          <wa-icon
            class="huboffice-shell__brand-icon"
            name="house-solid-full"
          ></wa-icon>
          <span class="huboffice-shell__title">ホーム</span>
        </div>
      `;
    }

    const heading =
      activeView === "settings" ? "設定" : (activeTool?.name ?? "ツール");

    return html`
      <div class="huboffice-shell__title-group">
        <wa-button
          id="huboffice-home-btn"
          size="xs"
          variant="neutral"
          appearance="outlined"
          aria-label="ホームへ戻る"
          @click=${() => void this.controller.goHome()}
        >
          <wa-icon name="house-solid-full"></wa-icon>
        </wa-button>
        <wa-tooltip for="huboffice-home-btn" trigger="hover"
          >ホームへ戻る</wa-tooltip
        >
        <span class="huboffice-shell__title">${heading}</span>
      </div>
    `;
  }

  private renderTopBar(): TemplateResult {
    const isSettings = this.controller.activeView === "settings";

    return html`
      <header class="huboffice-shell__bar">
        ${this.renderTopBarLeft()}
        <div class="huboffice-shell__bar-actions">
          <wa-button
            id="huboffice-settings-btn"
            size="xs"
            variant=${isSettings ? "brand" : "neutral"}
            appearance=${isSettings ? "filled" : "outlined"}
            aria-label="設定"
            aria-pressed=${String(isSettings)}
            @click=${() => void this.controller.toggleSettings()}
          >
            <wa-icon name="gear-solid-full"></wa-icon>
          </wa-button>
          <wa-tooltip for="huboffice-settings-btn" trigger="hover"
            >設定</wa-tooltip
          >
        </div>
      </header>
    `;
  }

  private renderActiveTool(toolId: string): TemplateResult {
    if (toolId === "wareki-converter") {
      return html`<wareki-converter-tool></wareki-converter-tool>`;
    }
    if (toolId === "qr-generator") {
      return html`<qr-generator-tool></qr-generator-tool>`;
    }
    return html`<p class="huboffice-shell__empty">ツールが見つかりません。</p>`;
  }

  private renderBody(): TemplateResult {
    const { activeView } = this.controller;

    if (activeView === "settings") {
      return html`
        <main class="huboffice-shell__body">
          ${renderSettingsView({
            themeMode: this.controller.themeMode,
            onChangeTheme: (mode) => void this.controller.setThemeMode(mode),
          })}
        </main>
      `;
    }

    if (activeView === "home") {
      return html`
        <main class="huboffice-shell__body">
          ${renderHomeView({
            tools: this.controller.visibleTools,
            filterQuery: this.controller.filterQuery,
            pinnedToolIds: this.controller.pinnedToolIds,
            onFilterChange: (q) => this.controller.setFilterQuery(q),
            onFilterClear: () => this.controller.setFilterQuery(""),
            onOpenTool: (id) => void this.controller.openTool(id),
            onTogglePin: (id) => void this.controller.togglePin(id),
          })}
        </main>
      `;
    }

    return html`
      <main
        class="huboffice-shell__body"
        @huboffice-copy-request=${(
          e: CustomEvent<{ label: string; value: string }>,
        ) => {
          void this.controller.copyText(e.detail.label, e.detail.value);
        }}
        @huboffice-toast=${(e: CustomEvent<{ message: string }>) => {
          this.controller.showToast(e.detail.message);
        }}
      >
        ${this.renderActiveTool(activeView)}
      </main>
    `;
  }

  override render(): TemplateResult {
    const { toastMessage } = this.controller;

    return html`
      ${this.renderTopBar()} ${this.renderBody()}
      ${
        toastMessage
          ? html`<div class="huboffice-shell__toast" role="status">
              ${toastMessage}
            </div>`
          : nothing
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "huboffice-app": HubOfficeApp;
  }
}
