import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { QuickAccessRepository } from "@/repositories/quick-access.repository.js";
import type { QuickAccessRecord } from "@/db/models";
import {
  QUICK_ACCESS_STATIC_ID,
  DEFAULT_QUICK_ACCESS,
} from "@/constants/quick-access.constants.js";

/**
 *
 *
 * @export
 * @class QuickAccessController
 * @implements {ReactiveController}
 */
export class QuickAccessController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: QuickAccessRepository;

  /** QuickAccessの初期値 */
  public state: QuickAccessRecord = {
    id: QUICK_ACCESS_STATIC_ID,
    ...DEFAULT_QUICK_ACCESS,
  };

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
  private async loadState(): Promise<void> {
    const record = await this.repository.getQuickAccess();
    this.state = { ...record };
    this.host.requestUpdate();
  }

  /**
   * DBを更新し、stateを更新する
   *
   * @private
   * @param {Partial<QuickAccessRecord>} partial
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  private async updateState(
    partial: Partial<QuickAccessRecord>,
  ): Promise<void> {
    const updated = await this.repository.updateQuickAccess(partial);
    this.state = { ...updated };
    this.host.requestUpdate();
  }

  // --- 単独・分類・ステータスフィルター（独立トグル） ---

  /**
   * ブックマークの状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public async toggleBookmarkSelected(): Promise<void> {
    await this.updateState({
      isBookmarkSelected: !this.state.isBookmarkSelected,
    });
  }

  /**
   * 未分類の状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public async toggleUncategorizedSelected(): Promise<void> {
    await this.updateState({
      isUncategorizedSelected: !this.state.isUncategorizedSelected,
    });
  }

  /**
   * 完了の状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public async toggleDoneSelected(): Promise<void> {
    await this.updateState({
      isDoneSelected: !this.state.isDoneSelected,
    });
  }

  /**
   * 対応中の状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public async toggleProgressSelected(): Promise<void> {
    await this.updateState({
      isProgressSelected: !this.state.isProgressSelected,
    });
  }

  /**
   * 未着手の状態をトグルする
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public async togglePendingSelected(): Promise<void> {
    await this.updateState({
      isPendingSelected: !this.state.isPendingSelected,
    });
  }

  // --- 期限フィルター（排他制御トグル）

  /**
   * 期限切れの選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（当日・間近）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public async toggleOverdueSelected(): Promise<void> {
    await this.updateState({
      isOverdueSelected: !this.state.isOverdueSelected,
      isAsapSelected: false,
      isUpcomingSelected: false,
    });
  }

  /**
   * 当日の選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（期限切れ・間近）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public async toggleAsapSelected(): Promise<void> {
    await this.updateState({
      isAsapSelected: !this.state.isAsapSelected,
      isOverdueSelected: false,
      isUpcomingSelected: false,
    });
  }

  /**
   * 期限間近の選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（期限切れ・当日）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public async toggleUpcomingSelected(): Promise<void> {
    await this.updateState({
      isUpcomingSelected: !this.state.isUpcomingSelected,
      isOverdueSelected: false,
      isAsapSelected: false,
    });
  }

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
