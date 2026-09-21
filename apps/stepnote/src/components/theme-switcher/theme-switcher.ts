import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { themeContext } from "@/contexts/index.js";
import type {
  ThemeController,
  ThemeMode,
} from "@/controllers/theme.controller.js";
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

  private _themeController?: ThemeController;
  private unsubTheme?: () => void;

  /**
   * テーマ状態管理コントローラー
   */
  @consume({ context: themeContext, subscribe: true })
  @property({ attribute: false })
  public set themeController(controller: ThemeController | undefined) {
    if (this._themeController === controller) return;

    if (this.unsubTheme) {
      this.unsubTheme();
      this.unsubTheme = undefined;
    }

    this._themeController = controller;

    if (controller && typeof controller.subscribe === "function") {
      this.unsubTheme = controller.subscribe(() => {
        this.requestUpdate();
      });
    }

    this.requestUpdate();
  }

  public get themeController(): ThemeController | undefined {
    return this._themeController;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.unsubTheme) {
      this.unsubTheme();
      this.unsubTheme = undefined;
    }
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
        <wa-dropdown-item
          value="light"
          type="checkbox"
          .checked=${currentTheme === "light"}
          ?checked=${currentTheme === "light"}
        >
          <wa-icon
            slot="icon"
            library="my-icons"
            name="sun-solid-full"
          ></wa-icon>
          ライト
        </wa-dropdown-item>
        <wa-dropdown-item
          value="dark"
          type="checkbox"
          .checked=${currentTheme === "dark"}
          ?checked=${currentTheme === "dark"}
        >
          <wa-icon
            slot="icon"
            library="my-icons"
            name="moon-solid-full"
          ></wa-icon>
          ダーク
        </wa-dropdown-item>
        <wa-divider></wa-divider>
        <wa-dropdown-item
          value="system"
          type="checkbox"
          .checked=${currentTheme === "system"}
          ?checked=${currentTheme === "system"}
        >
          <wa-icon
            slot="icon"
            library="my-icons"
            name="display-solid-full"
          ></wa-icon>
          システム
        </wa-dropdown-item>
      </wa-dropdown>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "theme-switcher": ThemeSwitcher;
  }
}
