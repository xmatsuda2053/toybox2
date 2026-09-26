import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { themeContext } from "@/contexts/index.js";
import type {
  ThemeController,
  ThemeMode,
} from "@/controllers/theme.controller.js";
import { ControllerSubscriber } from "@/utils/controller-subscriber.js";
import themeSwitcherStyles from "./theme-switcher.scss?inline";

/**
 * テーマ切り替えドロップダウンコンポーネント (ThemeSwitcher)
 *
 * ヘッダー等に配置され、System / Light / Dark の 3 値切り替えドロップダウンを提供する。
 *
 * @export
 * @class ThemeSwitcher
 * @extends {LitElement}
 */
@customElement("theme-switcher")
export class ThemeSwitcher extends LitElement {
  public static override styles = unsafeCSS(themeSwitcherStyles);

  private subscriber = new ControllerSubscriber(this);
  private _themeController?: ThemeController;

  /**
   * テーマ状態管理コントローラー
   */
  @consume({ context: themeContext, subscribe: true })
  @property({ attribute: false })
  public set themeController(controller: ThemeController | undefined) {
    if (this._themeController === controller) return;

    this._themeController = controller;
    this.subscriber.subscribe("theme", controller);
    this.requestUpdate();
  }

  public get themeController(): ThemeController | undefined {
    return this._themeController;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.subscriber.unsubscribeAll();
  }

  /**
   * ドロップダウンでテーマが選択されたときのハンドラー
   */
  public handleThemeSelect = (
    event: CustomEvent<{ item: { value: string } }>,
  ): void => {
    const value = event.detail.item.value as ThemeMode;
    this.themeController?.setTheme(value);
    this.requestUpdate();
  };

  /**
   * 現在選択中のテーマに応じたアイコン名を取得する。
   */
  public get currentThemeIcon(): string {
    const theme = this.themeController?.theme ?? "system";
    switch (theme) {
      case "light":
        return "sun-solid-full";
      case "dark":
        return "moon-solid-full";
      case "system":
      default:
        return "display-solid-full";
    }
  }

  /**
   * 現在選択中のテーマに応じたアクセシビリティラベルを取得する。
   */
  public get currentThemeLabel(): string {
    const theme = this.themeController?.theme ?? "system";
    switch (theme) {
      case "light":
        return "テーマ: ライト";
      case "dark":
        return "テーマ: ダーク";
      case "system":
      default:
        return "テーマ: システム";
    }
  }

  /**
   * テーマ選択ドロップダウンの各アイテムを描画する。
   *
   * @private
   * @param {ThemeMode} value テーマ値
   * @param {string} label 表示ラベル
   * @param {string} iconName アイコン名
   * @param {ThemeMode} currentTheme 現在選択中のテーマ
   * @return {HTMLTemplateResult}
   * @memberof ThemeSwitcher
   */
  private renderThemeItem(
    value: ThemeMode,
    label: string,
    iconName: string,
    currentTheme: ThemeMode,
  ): HTMLTemplateResult {
    const isChecked = currentTheme === value;
    return html`
      <wa-dropdown-item
        value="${value}"
        type="checkbox"
        .checked=${isChecked}
        ?checked=${isChecked}
      >
        <wa-icon slot="icon" library="my-icons" name=${iconName}></wa-icon>
        ${label}
      </wa-dropdown-item>
    `;
  }

  override render() {
    const currentTheme = this.themeController?.theme ?? "system";

    return html`
      <wa-dropdown placement="bottom-end" @wa-select=${this.handleThemeSelect}>
        <wa-button
          id="btn-theme-dropdown"
          class="btn-theme-dropdown"
          slot="trigger"
          variant="neutral"
          appearance="plain"
          size="s"
        >
          <wa-icon
            library="my-icons"
            name=${this.currentThemeIcon}
            label=${this.currentThemeLabel}
          ></wa-icon>
        </wa-button>
        ${this.renderThemeItem("light", "ライト", "sun-solid-full", currentTheme)}
        ${this.renderThemeItem("dark", "ダーク", "moon-solid-full", currentTheme)}
        <wa-divider></wa-divider>
        ${this.renderThemeItem("system", "システム", "display-solid-full", currentTheme)}
      </wa-dropdown>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "theme-switcher": ThemeSwitcher;
  }
}
