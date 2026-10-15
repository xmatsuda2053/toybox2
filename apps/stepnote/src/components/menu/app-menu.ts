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

  override render() {
    const isOpen = this.isNavigationListAreaOpen;
    const toggleTooltip = isOpen
      ? "サイドパネルを閉じる"
      : "サイドパネルを開く";

    return html`
      <!-- 上部エリア (メイン機能群) -->
      <div class="app-menu__primary">
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
