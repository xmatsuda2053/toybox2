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

function renderThemeSection(
  themeMode: ThemeMode,
  onChangeTheme: (mode: ThemeMode) => void,
): TemplateResult {
  const isSelected = (mode: ThemeMode) => themeMode === mode;

  return html`
    <section class="settings-view__section">
      <h2 class="settings-view__heading">カラーテーマ</h2>
      <p class="settings-view__description">
        Side Panel の外観テーマを切り替えます。
      </p>
      <wa-button-group label="テーマ設定">
        <wa-button
          size="small"
          variant=${isSelected("light") ? "brand" : "neutral"}
          appearance=${isSelected("light") ? "filled" : "outlined"}
          @click=${() => onChangeTheme("light")}
        >
          <wa-icon slot="start" name="sun-solid-full"></wa-icon>
          ライト
        </wa-button>
        <wa-button
          size="small"
          variant=${isSelected("dark") ? "brand" : "neutral"}
          appearance=${isSelected("dark") ? "filled" : "outlined"}
          @click=${() => onChangeTheme("dark")}
        >
          <wa-icon slot="start" name="moon-solid-full"></wa-icon>
          ダーク
        </wa-button>
        <wa-button
          size="small"
          variant=${isSelected("system") ? "brand" : "neutral"}
          appearance=${isSelected("system") ? "filled" : "outlined"}
          @click=${() => onChangeTheme("system")}
        >
          <wa-icon slot="start" name="display-solid-full"></wa-icon>
          システム連動
        </wa-button>
      </wa-button-group>
    </section>
  `;
}

function renderImportButtons(
  onRequestImport: (kind: ImportKind) => void,
): TemplateResult {
  return html`
    <div class="settings-view__btn-grid">
      <wa-button
        size="small"
        variant="neutral"
        appearance="outlined"
        @click=${() => onRequestImport("staff-csv")}
      >
        <wa-icon slot="start" name="upload-solid-full"></wa-icon>
        職員 CSV をインポート
      </wa-button>
      <wa-button
        size="small"
        variant="neutral"
        appearance="outlined"
        @click=${() => onRequestImport("org-csv")}
      >
        <wa-icon slot="start" name="upload-solid-full"></wa-icon>
        組織 CSV をインポート
      </wa-button>
      <wa-button
        size="small"
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
        size="small"
        variant="neutral"
        appearance="outlined"
        @click=${props.onExportStaffCsv}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        職員 CSV をエクスポート（BOM付 UTF-8）
      </wa-button>
      <wa-button
        size="small"
        variant="neutral"
        appearance="outlined"
        @click=${props.onExportOrgCsv}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        組織 CSV をエクスポート（BOM付 UTF-8）
      </wa-button>
      <wa-button
        size="small"
        variant="neutral"
        appearance="outlined"
        @click=${props.onExportJson}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        一括 JSON をエクスポート
      </wa-button>
      <wa-button
        size="small"
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
        <wa-tag size="small">職員: ${props.staffCount} 件</wa-tag>
        <wa-tag size="small">組織: ${props.organizationCount} 件</wa-tag>
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
        でどのタブからでも HubAddress サイドパネルを開けます。
      </p>
      <p class="settings-view__description">
        キー変更は Chrome（chrome://extensions/shortcuts）または
        Edge（edge://extensions/shortcuts）から設定できます。
      </p>
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
