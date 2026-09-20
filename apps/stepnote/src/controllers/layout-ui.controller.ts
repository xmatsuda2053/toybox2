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
   * 状態変更を購読するリスナー関数のセット
   *
   * @private
   * @type {Set<() => void>}
   * @memberof LayoutUIController
   */
  private listeners: Set<() => void> = new Set();

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
   * 状態変更リスナーを登録する（Observer / Subscribe パターン）。
   *
   * 状態が変更された際に呼び出されるコールバック関数を登録します。
   * 戻り値として、登録したリスナーを安全に解除するための購読解除関数（Unsubscribe）を返却します。
   *
   * @param {() => void} listener 状態変更時に実行するコールバック関数
   * @return {() => void} 購読を解除するための関数
   * @memberof LayoutUIController
   */
  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * ホストコンポーネントおよびすべての購読リスナーへ状態変更を通知する内部ヘルパー。
   *
   * @private
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  private notify = (): void => {
    this.host.requestUpdate();
    this.listeners.forEach((listener) => listener());
  };

  /**
   * QUICK ACCESS の 開閉状態を反転させ、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public toggleQuickAccess = (): void => {
    this._state = {
      ...this._state,
      isQuickAccessOpen: !this._state.isQuickAccessOpen,
    };
    this.notify();
  };

  /**
   * ナビゲーションエリアの開閉状態を反転させ、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public toggleNavigationArea = (): void => {
    this._state = {
      ...this._state,
      isNavigationAreaOpen: !this._state.isNavigationAreaOpen,
    };
    this.notify();
  };

  /**
   * ナビゲーションリストエリアの開閉状態を反転させ、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public toggleNavigationListArea = (): void => {
    this._state = {
      ...this._state,
      isNavigationListAreaOpen: !this._state.isNavigationListAreaOpen,
    };
    this.notify();
  };

  /**
   * QUICK ACCESS の 開閉状態を明示的に設定し、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public setQuickAccessOpen = (isOpen: boolean): void => {
    if (this._state.isQuickAccessOpen === isOpen) return;
    this._state = {
      ...this._state,
      isQuickAccessOpen: isOpen,
    };
    this.notify();
  };

  /**
   * ナビゲーションエリア の 開閉状態を明示的に設定し、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public setNavigationAreaOpen = (isOpen: boolean): void => {
    if (this._state.isNavigationAreaOpen === isOpen) return;
    this._state = {
      ...this._state,
      isNavigationAreaOpen: isOpen,
    };
    this.notify();
  };

  /**
   * ナビゲーションリストエリア の 開閉状態を明示的に設定し、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public setNavigationListAreaOpen = (isOpen: boolean): void => {
    if (this._state.isNavigationListAreaOpen === isOpen) return;
    this._state = {
      ...this._state,
      isNavigationListAreaOpen: isOpen,
    };
    this.notify();
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
