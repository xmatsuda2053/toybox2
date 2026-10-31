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
    isJournalAreaOpen: true,
    isZenMode: false,
    isScratchMode: false,
    isSettingsMode: false,
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
   * ナビゲーションリストまたはジャーナルの開閉変更を適用し、必要に応じて集中モードを解除する。
   *
   * @private
   * @param {{ isNavigationListAreaOpen?: boolean; isJournalAreaOpen?: boolean }} updates
   * @memberof LayoutUIController
   */
  private updatePaneOpenState(updates: {
    isNavigationListAreaOpen?: boolean;
    isJournalAreaOpen?: boolean;
  }): void {
    if (this._state.isScratchMode || this._state.isSettingsMode) return;

    const nextNav =
      updates.isNavigationListAreaOpen ?? this._state.isNavigationListAreaOpen;
    const nextJournal =
      updates.isJournalAreaOpen ?? this._state.isJournalAreaOpen;
    const shouldExitZen = this._state.isZenMode && (nextNav || nextJournal);

    this._state = {
      ...this._state,
      ...updates,
      isZenMode: shouldExitZen ? false : this._state.isZenMode,
    };
    this.notify();
  }

  /**
   * 全画面モード（Scratch / Settings）の状態遷移を一括適用する。
   *
   * @private
   * @param {{ isScratchMode: boolean; isSettingsMode: boolean }} updates
   * @memberof LayoutUIController
   */
  private applyFullScreenMode(updates: {
    isScratchMode: boolean;
    isSettingsMode: boolean;
  }): void {
    const isAnyFullScreen = updates.isScratchMode || updates.isSettingsMode;
    this._state = {
      ...this._state,
      ...updates,
      isNavigationListAreaOpen: !isAnyFullScreen,
      isJournalAreaOpen: !isAnyFullScreen,
      isZenMode: false,
    };
    this.notify();
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
    this.updatePaneOpenState({
      isNavigationListAreaOpen: !this._state.isNavigationListAreaOpen,
    });
  };

  /**
   * ジャーナルエリアの開閉・縮小状態を反転させ、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public toggleJournalArea = (): void => {
    this.updatePaneOpenState({
      isJournalAreaOpen: !this._state.isJournalAreaOpen,
    });
  };

  /**
   * 集中モード（Zen Mode）の有効・無効を反転させ、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public toggleZenMode = (): void => {
    this.setZenMode(!this._state.isZenMode);
  };

  /**
   * 集中モード（Zen Mode）の有効・無効を明示的に設定する。
   *
   * @param {boolean} enabled
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public setZenMode = (enabled: boolean): void => {
    if (
      this._state.isScratchMode ||
      this._state.isSettingsMode ||
      this._state.isZenMode === enabled
    ) {
      return;
    }

    if (enabled) {
      this._state = {
        ...this._state,
        isZenMode: true,
        isNavigationListAreaOpen: false,
        isJournalAreaOpen: false,
      };
    } else {
      this._state = {
        ...this._state,
        isZenMode: false,
        isNavigationListAreaOpen: true,
        isJournalAreaOpen: true,
      };
    }
    this.notify();
  };

  /**
   * 全画面スクラッチモード（Scratch Mode）の有効・無効を反転させ、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public toggleScratchMode = (): void => {
    this.setScratchMode(!this._state.isScratchMode);
  };

  /**
   * 全画面スクラッチモード（Scratch Mode）の有効・無効を明示的に設定する。
   *
   * @param {boolean} enabled
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public setScratchMode = (enabled: boolean): void => {
    if (this._state.isSettingsMode || this._state.isScratchMode === enabled) {
      return;
    }
    this.applyFullScreenMode({
      isScratchMode: enabled,
      isSettingsMode: false,
    });
  };

  /**
   * 全画面設定モード（Settings Mode）の有効・無効を反転させ、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public toggleSettingsMode = (): void => {
    this.setSettingsMode(!this._state.isSettingsMode);
  };

  /**
   * 全画面設定モード（Settings Mode）の有効・無効を明示的に設定する。
   *
   * @param {boolean} enabled
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public setSettingsMode = (enabled: boolean): void => {
    if (this._state.isScratchMode || this._state.isSettingsMode === enabled) {
      return;
    }
    this.applyFullScreenMode({
      isScratchMode: false,
      isSettingsMode: enabled,
    });
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
    if (
      this._state.isNavigationListAreaOpen === isOpen &&
      (!this._state.isZenMode || !isOpen)
    ) {
      return;
    }
    this.updatePaneOpenState({ isNavigationListAreaOpen: isOpen });
  };

  /**
   * ジャーナルエリア の 開閉・縮小状態を明示的に設定し、ホストおよび全購読コンポーネントへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @return {*} {void}
   * @memberof LayoutUIController
   */
  public setJournalAreaOpen = (isOpen: boolean): void => {
    if (
      this._state.isJournalAreaOpen === isOpen &&
      (!this._state.isZenMode || !isOpen)
    ) {
      return;
    }
    this.updatePaneOpenState({ isJournalAreaOpen: isOpen });
  };
}
