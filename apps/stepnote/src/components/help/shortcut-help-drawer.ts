import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import shortcutHelpDrawerStyles from "./shortcut-help-drawer.scss?inline";
import {
  SHORTCUT_CATEGORIES,
  type ShortcutCategory,
  type ShortcutItem,
} from "./shortcut-help.constants.js";

/**
 * キーボードショートカット クイックヘルプ Drawer (ShortcutHelpDrawer)
 *
 * 画面右端からスライドイン表示され、StepNote の主要なショートカット一覧を提供する。
 *
 * @export
 * @class ShortcutHelpDrawer
 * @extends {LitElement}
 */
@customElement("shortcut-help-drawer")
export class ShortcutHelpDrawer extends LitElement {
  public static override styles = unsafeCSS(shortcutHelpDrawerStyles);

  /**
   * Drawer の開閉状態
   */
  @property({ type: Boolean, reflect: true })
  public open = false;

  /**
   * Drawer のヘッダータイトル
   */
  @property({ type: String })
  public label = "ショートカット一覧";

  /**
   * Drawer 閉鎖時のハンドラー。
   * 閉じるカスタムイベントを発火する。
   */
  public handleClose(): void {
    this.dispatchEvent(
      new CustomEvent("drawer-close", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * 単一ショートカット項目のレンダリング
   */
  private renderShortcutItem(item: ShortcutItem) {
    return html`
      <li class="shortcut-help-drawer__item">
        <span class="shortcut-help-drawer__desc">${item.description}</span>
        <span class="shortcut-help-drawer__keys">
          ${item.keys.map(
            (key) => html`<kbd class="shortcut-help-drawer__key">${key}</kbd>`,
          )}
        </span>
      </li>
    `;
  }

  /**
   * ショートカットカテゴリセクションのレンダリング
   */
  private renderCategory(category: ShortcutCategory) {
    return html`
      <section class="shortcut-help-drawer__section">
        <h3 class="shortcut-help-drawer__title">${category.title}</h3>
        <ul class="shortcut-help-drawer__list">
          ${category.items.map((item) => this.renderShortcutItem(item))}
        </ul>
      </section>
    `;
  }

  public override render() {
    return html`
      <wa-drawer
        class="shortcut-help-drawer"
        label=${this.label}
        placement="end"
        ?open=${this.open}
        @wa-after-hide=${this.handleClose}
      >
        <div class="shortcut-help-drawer__content">
          ${SHORTCUT_CATEGORIES.map((cat) => this.renderCategory(cat))}
        </div>
      </wa-drawer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "shortcut-help-drawer": ShortcutHelpDrawer;
  }
}
