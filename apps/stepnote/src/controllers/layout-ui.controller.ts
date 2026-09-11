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
    isArea1Open: true,
    isArea2Open: true,
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
   * エリア1の開閉状態を反転させ、ホストへ再描画を要求する。
   *
   * @memberof LayoutUIController
   */
  public toggleArea1 = (): void => {
    this._state = {
      ...this._state,
      isArea1Open: !this._state.isArea1Open,
    };
    this.host.requestUpdate();
  };

  /**
   * エリア2の開閉状態を反転させ、ホストへ再描画を要求する。
   *
   * @memberof LayoutUIController
   */
  public toggleArea2 = (): void => {
    this._state = {
      ...this._state,
      isArea2Open: !this._state.isArea2Open,
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
   * エリア1 の 開閉状態を明示的に設定し、ホストへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @memberof LayoutUIController
   */
  public setArea1Open = (isOpen: boolean): void => {
    if (this._state.isArea1Open === isOpen) return;
    this._state = {
      ...this._state,
      isArea1Open: isOpen,
    };
    this.host.requestUpdate();
  };

  /**
   * エリア2 の 開閉状態を明示的に設定し、ホストへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @memberof LayoutUIController
   */
  public setArea2Open = (isOpen: boolean): void => {
    if (this._state.isArea2Open === isOpen) return;
    this._state = {
      ...this._state,
      isArea2Open: isOpen,
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
