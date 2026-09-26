import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { layoutUIContext } from "@/contexts/index.js";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import paneMenuStyles from "./pane-menu.scss?inline";

/**
 * Menu ペインコンポーネント (PaneMenu)
 *
 * 画面最左端（幅 50px 固定）のメニュー領域を担当する。
 * 上部（menu-primary）にサイドパネル開閉トグルボタン等の主要操作群、
 * 下部（menu-secondary）に将来の補助機能メニュー群を配置する。
 *
 * @export
 * @class PaneMenu
 * @extends {LitElement}
 */
@customElement("pane-menu")
export class PaneMenu extends LitElement {
  public static override styles = unsafeCSS(paneMenuStyles);

  /**
   * サイドパネル（ナビゲーションおよびタスク一覧）の開閉状態
   *
   * @type {boolean}
   * @memberof PaneMenu
   */
  @property({ type: Boolean })
  public isNavigationListAreaOpen: boolean = true;

  /**
   * レイアウト状態管理コントローラー
   *
   * @type {LayoutUIController}
   * @memberof PaneMenu
   */
  @consume({ context: layoutUIContext, subscribe: true })
  public layoutUIController?: LayoutUIController;

  /**
   * サイドパネル（ナビゲーションおよびタスク一覧）の開閉状態を切り替える。
   *
   * @memberof PaneMenu
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
      <div class="pane-menu__primary menu-primary">
        <wa-tooltip for="btn-toggle-sidebar" placement="right">
          ${toggleTooltip}
        </wa-tooltip>
        <wa-button
          id="btn-toggle-sidebar"
          class="pane-menu__toggle-btn btn-toggle-sidebar"
          variant="neutral"
          appearance="plain"
          size="s"
          @click=${this.handleToggleNavigationList}
        >
          <wa-icon
            library="my-icons"
            name="chevron-right"
            class="pane-menu__toggle-icon icon-toggle-sidebar ${isOpen ? "is-open" : "is-closed"}"
            label=${toggleTooltip}
          ></wa-icon>
        </wa-button>
      </div>

      <!-- 下部エリア (将来の補助機能群) -->
      <div class="pane-menu__secondary menu-secondary"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "pane-menu": PaneMenu;
  }
}
