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
 * テーマオプション定義
 */
interface ThemeOption {
  readonly value: ThemeMode;
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

/**
 * テーマ選択肢一覧（Light -> Dark -> System）
 */
const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    value: "light",
    id: "btn-theme-light",
    label: "ライト",
    icon: "sun-solid-full",
  },
  {
    value: "dark",
    id: "btn-theme-dark",
    label: "ダーク",
    icon: "moon-solid-full",
  },
  {
    value: "system",
    id: "btn-theme-system",
    label: "システム",
    icon: "display-solid-full",
  },
] as const;

/**
 * テーマ切り替えセグメントボタングループコンポーネント (ThemeSwitcher)
 *
 * ヘッダー等に配置され、Light / Dark / System の 3 値切り替えボタングループを提供する。
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
    this._themeController = this.subscriber.bind(
      "theme",
      this._themeController,
      controller,
    );
  }

  public get themeController(): ThemeController | undefined {
    return this._themeController;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.subscriber.unsubscribeAll();
  }

  /**
   * ボタンクリックでテーマが変更されたときのハンドラー
   */
  public handleThemeChange = (theme: ThemeMode): void => {
    this.themeController?.setTheme(theme);
    this.requestUpdate();
  };

  /**
   * 単一のテーマ切り替えボタンを描画する。
   *
   * @private
   * @param {ThemeOption} option テーマ選択肢
   * @param {ThemeMode} currentTheme 現在選択中のテーマ
   * @return {HTMLTemplateResult}
   * @memberof ThemeSwitcher
   */
  private renderThemeButton(
    option: ThemeOption,
    currentTheme: ThemeMode,
  ): HTMLTemplateResult {
    const isActive = currentTheme === option.value;
    const appearance = isActive ? "filled" : "plain";
    const ariaPressed = isActive ? "true" : "false";
    const className = isActive
      ? "theme-switcher__btn theme-switcher__btn--active"
      : "theme-switcher__btn";

    return html`
      <wa-button
        id="${option.id}"
        class="${className}"
        variant="neutral"
        appearance="${appearance}"
        size="s"
        aria-pressed="${ariaPressed}"
        @click=${() => this.handleThemeChange(option.value)}
      >
        <wa-icon library="my-icons" name="${option.icon}"></wa-icon>
      </wa-button>
    `;
  }

  /**
   * 各ボタンに対応するツールチップ群を描画する。
   *
   * @private
   * @return {HTMLTemplateResult[]}
   * @memberof ThemeSwitcher
   */
  private renderTooltips(): HTMLTemplateResult[] {
    return THEME_OPTIONS.map(
      (option) =>
        html`<wa-tooltip for="${option.id}">${option.label}</wa-tooltip>`,
    );
  }

  override render() {
    const currentTheme = this.themeController?.theme ?? "system";

    return html`
      <wa-button-group label="テーマ切り替え" class="theme-switcher">
        ${THEME_OPTIONS.map((option) =>
          this.renderThemeButton(option, currentTheme),
        )}
      </wa-button-group>
      ${this.renderTooltips()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "theme-switcher": ThemeSwitcher;
  }
}
