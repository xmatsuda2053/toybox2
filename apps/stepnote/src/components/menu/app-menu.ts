import { html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  SubscriberElement,
  WithLabelsController,
  WithLayoutUIController,
} from "@/utils/controller-consumers.mixin.js";
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
 * @extends {WithLayoutUIController(WithLabelsController(SubscriberElement))}
 */
@customElement("app-menu")
export class AppMenu extends WithLayoutUIController(
  WithLabelsController(SubscriberElement),
) {
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
   * 全画面スクラッチモード（Scratch Mode）の有効・無効状態
   *
   * @type {boolean}
   * @memberof AppMenu
   */
  @property({ type: Boolean })
  public isScratchMode: boolean = false;

  /**
   * 登録済みのラベルが存在するか判定する
   *
   * @readonly
   * @type {boolean}
   * @memberof AppMenu
   */
  public get hasLabels(): boolean {
    if (!this.labelsController) {
      return false;
    }
    return (
      this.labelsController.hasLabels ??
      ((this.labelsController.state?.length ?? 0) > 0)
    );
  }

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
   * 全画面スクラッチモード（Scratch Mode）の有効・無効状態を切り替える。
   *
   * @memberof AppMenu
   */
  public handleToggleScratchMode = (): void => {
    this.layoutUIController?.toggleScratchMode();
  };

  /**
   * 新規タスク作成ダイアログの表示リクエストイベントを発行する。
   *
   * @memberof AppMenu
   */
  public handleCreateTask = (): void => {
    if (!this.hasLabels) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("request-task-create", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * サイドパネル開閉トグルボタンを描画する。
   *
   * @private
   * @param {boolean} isOpen
   * @param {boolean} isDisabled
   * @memberof AppMenu
   */
  private renderSidebarToggleButton(isOpen: boolean, isDisabled: boolean = false) {
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
        ?disabled=${isDisabled}
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
   * クイック新規タスク作成ボタンを描画する。
   *
   * @private
   * @param {boolean} hasLabels
   * @param {boolean} isDisabled
   * @memberof AppMenu
   */
  private renderTaskCreateButton(hasLabels: boolean, isDisabled: boolean = false) {
    const createTooltip = hasLabels
      ? "新規タスクを作成 (Alt+N)"
      : "ラベルを登録してください";

    return html`
      <wa-tooltip for="app-menu-task-create-btn" placement="right">
        ${createTooltip}
      </wa-tooltip>
      <wa-button
        id="app-menu-task-create-btn"
        class="app-menu__task-create-btn"
        variant="neutral"
        appearance="plain"
        size="s"
        ?disabled=${!hasLabels || isDisabled}
        @click=${this.handleCreateTask}
      >
        <wa-icon
          library="my-icons"
          name="plus-solid-full"
          class="app-menu__task-create-icon"
          label=${createTooltip}
        ></wa-icon>
      </wa-button>
    `;
  }

  /**
   * スクラッチモード切替ボタンを描画する。
   *
   * @private
   * @param {boolean} isScratch
   * @memberof AppMenu
   */
  private renderScratchButton(isScratch: boolean) {
    const scratchTooltip = isScratch
      ? "スクラッチモードを終了"
      : "スクラッチモード（アプリ共通メモ）を開く";

    return html`
      <wa-tooltip for="app-menu-scratch-btn" placement="right">
        ${scratchTooltip}
      </wa-tooltip>
      <wa-button
        id="app-menu-scratch-btn"
        class="app-menu__scratch-btn ${isScratch ? "is-active" : ""}"
        variant="neutral"
        appearance="plain"
        size="s"
        @click=${this.handleToggleScratchMode}
      >
        <wa-icon
          library="my-icons"
          name="pen-to-square-solid-full"
          class="app-menu__scratch-icon"
          label=${scratchTooltip}
        ></wa-icon>
      </wa-button>
    `;
  }

  /**
   * 集中モード切替ボタンを描画する。
   *
   * @private
   * @param {boolean} isZen
   * @param {boolean} isDisabled
   * @memberof AppMenu
   */
  private renderZenModeButton(isZen: boolean, isDisabled: boolean = false) {
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
        ?disabled=${isDisabled}
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
        ${this.renderSidebarToggleButton(
          this.isNavigationListAreaOpen,
          this.isScratchMode,
        )}
        ${this.renderTaskCreateButton(this.hasLabels, this.isScratchMode)}
        ${this.renderScratchButton(this.isScratchMode)}
        ${this.renderZenModeButton(this.isZenMode, this.isScratchMode)}
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
