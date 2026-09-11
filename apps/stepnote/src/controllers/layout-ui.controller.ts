import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { LayoutState } from "@/types/view/ui.types";

/**
 * 画面全体のレイアウト状態（各パネル・ドロワーの開閉フラグ）を管理する Reactive Controller
 *
 * @export
 * @class LayoutUIController
 * @implements {ReactiveController}
 */
export class LayoutUIController implements ReactiveController {
  /**
   * このコントローラーを保持する Lit コンポーネントのホスト参照
   *
   * @private
   * @type {ReactiveControllerHost}
   * @memberof LayoutUIController
   */
  private host: ReactiveControllerHost;

  /**
   * 画面開閉の状態を保持するステートオブジェクト（内部状態）
   *
   * @type {LayoutState}
   * @memberof LayoutUIController
   */
  private _state: LayoutState = {
    isQuickAccessOpen: true,
    isNavigationAreaOpen: true,
    isNavigationListAreaOpen: true,
  };

  /**
   * 画面開閉の状態（読み取り専用）
   *
   * @readonly
   * @type {Readonly<LayoutState>}
   * @memberof LayoutUIController
   */
  public get state(): Readonly<LayoutState> {
    return this._state;
  }

  /**
   * Creates an instance of LayoutUIController.
   * @param {ReactiveControllerHost} host
   * @memberof LayoutUIController
   */
  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  /**
   * QUICK ACCESS の 開閉状態を反転させ、ホストへ再描画を要求する。
   *
   * @memberof LayoutUIController
   */
  public toggleQuickAccess = (): void => {
    this._state = {
      ...this._state,
      isQuickAccessOpen: !this._state.isQuickAccessOpen,
    };
    this.host.requestUpdate();
  };

  /**
   * ナビゲーションエリアの開閉状態を反転させ、ホストへ再描画を要求する。
   *
   * @memberof LayoutUIController
   */
  public toggleNavigationArea = (): void => {
    this._state = {
      ...this._state,
      isNavigationAreaOpen: !this._state.isNavigationAreaOpen,
    };
    this.host.requestUpdate();
  };

  /**
   * ナビゲーションリストエリアの開閉状態を反転させ、ホストへ再描画を要求する。
   *
   * @memberof LayoutUIController
   */
  public toggleNavigationListArea = (): void => {
    this._state = {
      ...this._state,
      isNavigationListAreaOpen: !this._state.isNavigationListAreaOpen,
    };
    this.host.requestUpdate();
  };

  /**
   * QUICK ACCESS の 開閉状態を明示的に設定し、ホストへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @memberof LayoutUIController
   */
  public setQuickAccessOpen = (isOpen: boolean): void => {
    if (this._state.isQuickAccessOpen === isOpen) return;
    this._state = {
      ...this._state,
      isQuickAccessOpen: isOpen,
    };
    this.host.requestUpdate();
  };

  /**
   * ナビゲーションエリア の 開閉状態を明示的に設定し、ホストへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @memberof LayoutUIController
   */
  public setNavigationAreaOpen = (isOpen: boolean): void => {
    if (this._state.isNavigationAreaOpen === isOpen) return;
    this._state = {
      ...this._state,
      isNavigationAreaOpen: isOpen,
    };
    this.host.requestUpdate();
  };

  /**
   * ナビゲーションリストエリア の 開閉状態を明示的に設定し、ホストへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @memberof LayoutUIController
   */
  public setNavigationListAreaOpen = (isOpen: boolean): void => {
    if (this._state.isNavigationListAreaOpen === isOpen) return;
    this._state = {
      ...this._state,
      isNavigationListAreaOpen: isOpen,
    };
    this.host.requestUpdate();
  };

  /**
   * hostConnected
   *
   * @memberof LayoutUIController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof LayoutUIController
   */
  hostDisconnected(): void {}
}
