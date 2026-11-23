import { html, type TemplateResult } from "lit";
import type { ThemeMode } from "../models/directory.model";
import type { ImportKind } from "../utils/import-preview.utils";

export interface SettingsViewProps {
  staffCount: number;
  organizationCount: number;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onRequestImport: (kind: ImportKind) => void;
  onExportStaffCsv: () => void;
  onExportOrgCsv: () => void;
  onExportJson: () => void;
  onRequestClearAll: () => void;
}

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

function renderImportButtons(
  onRequestImport: (kind: ImportKind) => void,
): TemplateResult {
  return html`
    <div class="settings-view__btn-grid">
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${() => onRequestImport("staff-csv")}
      >
        <wa-icon slot="start" name="upload-solid-full"></wa-icon>
        職員 CSV をインポート
      </wa-button>
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${() => onRequestImport("org-csv")}
      >
        <wa-icon slot="start" name="upload-solid-full"></wa-icon>
        組織 CSV をインポート
      </wa-button>
      <wa-button
        size="s"
        variant="brand"
        appearance="outlined"
        @click=${() => onRequestImport("json")}
      >
        <wa-icon slot="start" name="upload-solid-full"></wa-icon>
        一括 JSON をインポート
      </wa-button>
    </div>
  `;
}

function renderExportButtons(props: SettingsViewProps): TemplateResult {
  return html`
    <div class="settings-view__btn-grid">
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${props.onExportStaffCsv}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        職員 CSV をエクスポート（BOM付 UTF-8）
      </wa-button>
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${props.onExportOrgCsv}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        組織 CSV をエクスポート（BOM付 UTF-8）
      </wa-button>
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${props.onExportJson}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        一括 JSON をエクスポート
      </wa-button>
      <wa-button
        size="s"
        variant="danger"
        appearance="outlined"
        @click=${props.onRequestClearAll}
      >
        <wa-icon slot="start" name="trash-solid-full"></wa-icon>
        すべての登録データを削除
      </wa-button>
    </div>
  `;
}

function renderImportExportSection(props: SettingsViewProps): TemplateResult {
  return html`
    <section class="settings-view__section">
      <h2 class="settings-view__heading">データ管理（CSV / JSON）</h2>
      <div class="settings-view__stats">
        <wa-tag size="s">職員: ${props.staffCount} 件</wa-tag>
        <wa-tag size="s">組織: ${props.organizationCount} 件</wa-tag>
      </div>
      <p class="settings-view__description">
        CSV（UTF-8 / Shift_JIS 自動判別）または一括 JSON
        からインポート（確認後に全件洗い替え）できます。
      </p>
      ${renderImportButtons(props.onRequestImport)}
      <wa-divider></wa-divider>
      ${renderExportButtons(props)}
    </section>
  `;
}

function renderShortcutSection(): TemplateResult {
  return html`
    <section class="settings-view__section">
      <h2 class="settings-view__heading">キーボードショートカット</h2>
      <p class="settings-view__description">
        既定のショートカット
        <span class="settings-view__shortcut-code">Alt+Shift+H</span>
        でどのタブからでも
        <span class="settings-view__nowrap">HubAddress</span>
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

/**
 * 設定タブビューをレンダリングする
 */
export function renderSettingsView(props: SettingsViewProps): TemplateResult {
  return html`
    <div class="settings-view">
      ${renderThemeSection(props.themeMode, props.onChangeTheme)}
      ${renderImportExportSection(props)} ${renderShortcutSection()}
    </div>
  `;
}
