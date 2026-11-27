import { html, type TemplateResult } from "lit";
import type { ThemeMode } from "../models/huboffice.model";

export interface SettingsViewProps {
  themeMode: ThemeMode;
  appVersion?: string;
  onChangeTheme: (mode: ThemeMode) => void;
}

const DEFAULT_APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";

interface ThemeOption {
  readonly value: ThemeMode;
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    value: "light",
    id: "theme-btn-light",
    label: "ライト",
    icon: "sun-solid-full",
  },
  {
    value: "dark",
    id: "theme-btn-dark",
    label: "ダーク",
    icon: "moon-solid-full",
  },
  {
    value: "system",
    id: "theme-btn-system",
    label: "システム",
    icon: "display-solid-full",
  },
] as const;

function renderThemeButton(
  option: ThemeOption,
  currentTheme: ThemeMode,
  onChangeTheme: (mode: ThemeMode) => void,
): TemplateResult {
  const isActive = currentTheme === option.value;

  return html`
    <wa-button
      id=${option.id}
      size="s"
      variant="neutral"
      appearance=${isActive ? "filled" : "plain"}
      aria-label=${option.label}
      aria-pressed=${isActive ? "true" : "false"}
      @click=${() => onChangeTheme(option.value)}
    >
      <wa-icon name=${option.icon}></wa-icon>
    </wa-button>
  `;
}

function renderThemeSection(
  themeMode: ThemeMode,
  onChangeTheme: (mode: ThemeMode) => void,
): TemplateResult {
  return html`
    <section class="settings-view__section">
      <div class="settings-view__theme-row">
        <h2 class="settings-view__heading">カラーテーマ</h2>
        <wa-button-group label="テーマ切り替え">
          ${THEME_OPTIONS.map((option) =>
            renderThemeButton(option, themeMode, onChangeTheme),
          )}
        </wa-button-group>
      </div>
      ${THEME_OPTIONS.map(
        (option) => html`
          <wa-tooltip for=${option.id} trigger="hover">
            ${option.label}
          </wa-tooltip>
        `,
      )}
    </section>
  `;
}

function renderShortcutSection(): TemplateResult {
  return html`
    <section class="settings-view__section">
      <h2 class="settings-view__heading">キーボードショートカット</h2>
      <p class="settings-view__description">
        既定のショートカット
        <span class="settings-view__shortcut-code">Alt+Shift+O</span>
        でどのタブからでも
        <span class="settings-view__nowrap">HubOffice</span>
        サイドパネルを開閉できます。
      </p>
      <p class="settings-view__description">
        キー変更や未割り当て時の確認は、各ブラウザのショートカット設定画面から行えます。
      </p>
      <ul class="settings-view__shortcut-list">
        <li>
          Chrome:
          <code class="settings-view__shortcut-url"
            >chrome://extensions/shortcuts</code
          >
        </li>
        <li>
          Edge:
          <code class="settings-view__shortcut-url"
            >edge://extensions/shortcuts</code
          >
        </li>
      </ul>
    </section>
  `;
}

function renderAppInfoSection(appVersion: string): TemplateResult {
  return html`
    <section class="settings-view__section">
      <h2 class="settings-view__heading">アプリ情報</h2>
      <div class="settings-view__info-row">
        <span class="settings-view__info-name">HubOffice</span>
        <span class="settings-view__version">v${appVersion}</span>
      </div>
    </section>
  `;
}

/**
 * 設定ビューをレンダリングする
 */
export function renderSettingsView(props: SettingsViewProps): TemplateResult {
  const version = props.appVersion ?? DEFAULT_APP_VERSION;
  return html`
    <div class="settings-view">
      ${renderThemeSection(props.themeMode, props.onChangeTheme)}
      ${renderShortcutSection()} ${renderAppInfoSection(version)}
    </div>
  `;
}
