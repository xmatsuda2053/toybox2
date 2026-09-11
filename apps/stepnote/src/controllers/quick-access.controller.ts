import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { QuickAccessRepository } from "@/repositories/quick-access.repository";
import type { QuickAccessRecord } from "@/db/models";
import {
  QUICK_ACCESS_STATIC_ID,
  DEFAULT_QUICK_ACCESS,
} from "@/constants/quick-access.constants";

/**
 * クイックアクセスフィルター状態を管理する Reactive Controller
 *
 * @export
 * @class QuickAccessController
 * @implements {ReactiveController}
 */
export class QuickAccessController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: QuickAccessRepository;

  /** QuickAccessの内部状態 */
  private _state: QuickAccessRecord = {
    id: QUICK_ACCESS_STATIC_ID,
    ...DEFAULT_QUICK_ACCESS,
  };

  /**
   * 現在のクイックアクセス状態（読み取り専用）
   *
   * @readonly
   * @type {Readonly<QuickAccessRecord>}
   * @memberof QuickAccessController
   */
  public get state(): Readonly<QuickAccessRecord> {
    return this._state;
  }

  /**
   * Controllerの非同期初期化状態。
   *
   * このプロパティの解決（then）されたタイミングで、本コントローラーの内部状態が完全に
   * 初期化されたことを保証する。
   *
   * @type {Promise<void>}
   * @memberof QuickAccessController
   */
  public readonly initialized: Promise<void>;

  /**
   * Creates an instance of QuickAccessController.
   * @param {ReactiveControllerHost} host
   * @param {QuickAccessRepository} repository
   * @memberof QuickAccessController
   */
  constructor(host: ReactiveControllerHost, repository: QuickAccessRepository) {
    this.host = host;
    this.host.addController(this);
    this.repository = repository;
    this.initialized = this.loadState();
  }

  /**
   * データベースから状態を再読み込みし、コンポーネントを再描画する。
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  private loadState = async (): Promise<void> => {
    const record = await this.repository.getQuickAccess();
    this._state = { ...record };
    this.host.requestUpdate();
  };

  /**
   * DBを更新し、stateを更新する
   *
   * @private
   * @param {Partial<QuickAccessRecord>} partial
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  private updateState = async (
    partial: Partial<QuickAccessRecord>,
  ): Promise<void> => {
    const updated = await this.repository.updateQuickAccess(partial);
    this._state = { ...updated };
    this.host.requestUpdate();
  };

  // --- 単独・分類・ステータスフィルター（独立トグル） ---

  /**
   * ブックマークの状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleBookmarkSelected = async (): Promise<void> => {
    await this.updateState({
      isBookmarkSelected: !this._state.isBookmarkSelected,
    });
  };

  /**
   * 未分類の状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleUncategorizedSelected = async (): Promise<void> => {
    await this.updateState({
      isUncategorizedSelected: !this._state.isUncategorizedSelected,
    });
  };

  /**
   * 完了の状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleDoneSelected = async (): Promise<void> => {
    await this.updateState({
      isDoneSelected: !this._state.isDoneSelected,
    });
  };

  /**
   * 対応中の状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleProgressSelected = async (): Promise<void> => {
    await this.updateState({
      isProgressSelected: !this._state.isProgressSelected,
    });
  };

  /**
   * 未着手の状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public togglePendingSelected = async (): Promise<void> => {
    await this.updateState({
      isPendingSelected: !this._state.isPendingSelected,
    });
  };

  // --- 期限フィルター（排他制御トグル）

  /**
   * 期限切れの選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（当日・間近）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleOverdueSelected = async (): Promise<void> => {
    await this.updateState({
      isOverdueSelected: !this._state.isOverdueSelected,
      isAsapSelected: false,
      isUpcomingSelected: false,
    });
  };

  /**
   * 当日の選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（期限切れ・間近）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleAsapSelected = async (): Promise<void> => {
    await this.updateState({
      isAsapSelected: !this._state.isAsapSelected,
      isOverdueSelected: false,
      isUpcomingSelected: false,
    });
  };

  /**
   * 期限間近の選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（期限切れ・当日）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleUpcomingSelected = async (): Promise<void> => {
    await this.updateState({
      isUpcomingSelected: !this._state.isUpcomingSelected,
      isOverdueSelected: false,
      isAsapSelected: false,
    });
  };

  /**
   * hostConnected
   *
   * @memberof QuickAccessController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof QuickAccessController
   */
  hostDisconnected(): void {}
}
