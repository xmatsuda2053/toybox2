import type { ReactiveControllerHost } from "lit";
import type { QuickAccessRepository } from "@/repositories/quick-access.repository";
import type { QuickAccessRecord } from "@/db/models";
import {
  QUICK_ACCESS_STATIC_ID,
  DEFAULT_QUICK_ACCESS,
} from "@/constants/quick-access.constants";
import { BaseDataController } from "./base-reactive.controller";

/** 期限フィルターのキー型 */
type DueDateFilterKey =
  | "isOverdueSelected"
  | "isAsapSelected"
  | "isUpcomingSelected";

/**
 * クイックアクセスフィルター状態を管理する Reactive Controller
 *
 * @export
 * @class QuickAccessController
 * @extends {BaseDataController}
 */
export class QuickAccessController extends BaseDataController<
  QuickAccessRepository,
  Readonly<QuickAccessRecord>
> {
  constructor(host: ReactiveControllerHost, repository: QuickAccessRepository) {
    super(host, repository, {
      id: QUICK_ACCESS_STATIC_ID,
      ...DEFAULT_QUICK_ACCESS,
    });
  }

  /**
   * フィルター設定をリポジトリから再取得し、変更を全購読者へ通知する。
   */
  protected async loadState(): Promise<void> {
    this._state = { ...(await this.repository.getQuickAccess()) };
    this.notify();
  }

  /**
   * DBを更新し、stateを更新して全購読者へ通知する。
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
    this.notify();
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

  // --- 期限フィルター（排他制御トグル） ---

  /**
   * 期限フィルターを排他的にトグルする共通内部ヘルパー。
   * 指定したキーのフラグを反転させ、他の期限フィルターはすべて false にリセットする。
   *
   * @private
   * @param {DueDateFilterKey} targetKey
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  private toggleExclusiveDueDateFilter = async (
    targetKey: DueDateFilterKey,
  ): Promise<void> => {
    const nextValue = !this._state[targetKey];
    await this.updateState({
      isOverdueSelected: false,
      isAsapSelected: false,
      isUpcomingSelected: false,
      [targetKey]: nextValue,
    });
  };

  /**
   * 期限切れの選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（当日・間近）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleOverdueSelected = async (): Promise<void> => {
    await this.toggleExclusiveDueDateFilter("isOverdueSelected");
  };

  /**
   * 当日の選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（期限切れ・間近）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleAsapSelected = async (): Promise<void> => {
    await this.toggleExclusiveDueDateFilter("isAsapSelected");
  };

  /**
   * 期限間近の選択状態をトグルする。
   * 選択状態が変更された場合、関連する他の期限フィルター（期限切れ・当日）の選択状態は解除される。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public toggleUpcomingSelected = async (): Promise<void> => {
    await this.toggleExclusiveDueDateFilter("isUpcomingSelected");
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
