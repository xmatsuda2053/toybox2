import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { layoutUIContext } from "@/contexts/index.js";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import appMenuStyles from "./app-menu.scss?inline";

/**
 * Menu コンポーネント (AppMenu)
 *
 * 画面最左端（幅 45px 固定）のメニュー領域を担当する。
 * 上部（app-menu__primary）にサイドパネル開閉トグルボタン等の主要操作群、
 * 下部（app-menu__secondary）に将来の補助機能メニュー群を配置する。
 *
 * @export
 * @class AppMenu
 * @extends {LitElement}
 */
@customElement("app-menu")
export class AppMenu extends LitElement {
  public static override styles = unsafeCSS(appMenuStyles);

  /**
   * サイドパネル（ナビゲーションおよびタスク一覧）の開閉状態
   *
   * @type {boolean}
   * @memberof AppMenu
   */
  @property({ type: Boolean })
  public isNavigationListAreaOpen: boolean = true;

  /**
   * 集中モード（Zen Mode）の有効・無効状態
   *
   * @type {boolean}
   * @memberof AppMenu
   */
  @property({ type: Boolean })
  public isZenMode: boolean = false;

  /**
   * レイアウト状態管理コントローラー
   *
   * @type {LayoutUIController}
   * @memberof AppMenu
   */
  @consume({ context: layoutUIContext, subscribe: true })
  public layoutUIController?: LayoutUIController;

  /**
   * サイドパネル（ナビゲーションおよびタスク一覧）の開閉状態を切り替える。
   *
   * @memberof AppMenu
   */
  public handleToggleNavigationList = (): void => {
    this.layoutUIController?.toggleNavigationListArea();
  };

  /**
   * 集中モード（Zen Mode）の有効・無効状態を切り替える。
   *
   * @memberof AppMenu
   */
  public handleToggleZenMode = (): void => {
    this.layoutUIController?.toggleZenMode();
  };

  /**
   * サイドパネル開閉トグルボタンを描画する。
   *
   * @private
   * @param {boolean} isOpen
   * @memberof AppMenu
   */
  private renderSidebarToggleButton(isOpen: boolean) {
    const toggleTooltip = isOpen
      ? "サイドパネルを閉じる"
      : "サイドパネルを開く";

    return html`
      <wa-tooltip for="app-menu-toggle-btn" placement="right">
        ${toggleTooltip}
      </wa-tooltip>
      <wa-button
        id="app-menu-toggle-btn"
        class="app-menu__toggle-btn"
        variant="neutral"
        appearance="plain"
        size="s"
        @click=${this.handleToggleNavigationList}
      >
        <wa-icon
          library="my-icons"
          name="chevron-right"
          class="app-menu__toggle-icon ${isOpen ? "is-open" : "is-closed"}"
          label=${toggleTooltip}
        ></wa-icon>
      </wa-button>
    `;
  }

  /**
   * 集中モード切替ボタンを描画する。
   *
   * @private
   * @param {boolean} isZen
   * @memberof AppMenu
   */
  private renderZenModeButton(isZen: boolean) {
    const zenTooltip = isZen
      ? "集中モードを解除（元のレイアウトに復帰）"
      : "集中モードを有効化（左右ペインを折りたたむ）";
    const zenIcon = isZen ? "compress-solid-full" : "expand-solid-full";

    return html`
      <wa-tooltip for="app-menu-zen-btn" placement="right">
        ${zenTooltip}
      </wa-tooltip>
      <wa-button
        id="app-menu-zen-btn"
        class="app-menu__zen-btn"
        variant="neutral"
        appearance="plain"
        size="s"
        @click=${this.handleToggleZenMode}
      >
        <wa-icon
          library="my-icons"
          name=${zenIcon}
          class="app-menu__zen-icon"
          label=${zenTooltip}
        ></wa-icon>
      </wa-button>
    `;
  }

  override render() {
    return html`
      <!-- 上部エリア (メイン機能群) -->
      <div class="app-menu__primary">
        ${this.renderSidebarToggleButton(this.isNavigationListAreaOpen)}
        ${this.renderZenModeButton(this.isZenMode)}
      </div>

      <!-- 下部エリア (将来の補助機能群) -->
      <div class="app-menu__secondary"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-menu": AppMenu;
  }
}
