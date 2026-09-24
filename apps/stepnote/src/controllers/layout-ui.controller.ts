import type { ReactiveControllerHost } from "lit";
import type { LayoutState } from "@/types/view/ui.types";
import { BaseReactiveController } from "./base-reactive.controller";

/**
 * 画面全体のレイアウト状態（各パネル・ドロワーの開閉フラグ）を管理する Reactive Controller
 *
 * @export
 * @class LayoutUIController
 * @extends {BaseReactiveController<void>}
 */
export class LayoutUIController extends BaseReactiveController<void> {
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
    super(host);
  }

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
}
