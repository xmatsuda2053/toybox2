import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { QuickAccessRepository } from "@/repositories/quick-access.repository";
import type { QuickAccessRecord } from "@/db/models";
import {
  QUICK_ACCESS_STATIC_ID,
  DEFAULT_QUICK_ACCESS,
} from "@/constants/quick-access.constants";

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
   * 状態変更を購読するリスナー関数のセット
   *
   * @private
   * @type {Set<() => void>}
   * @memberof QuickAccessController
   */
  private listeners: Set<() => void> = new Set();

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
   * 状態変更リスナーを登録する（Observer / Subscribe パターン）。
   *
   * 状態が変更（DB更新完了）された際に呼び出されるコールバック関数を登録します。
   * 戻り値として、登録したリスナーを安全に解除するための購読解除関数（Unsubscribe）を返却します。
   *
   * @param {() => void} listener 状態変更時に実行するコールバック関数
   * @return {() => void} 購読を解除するための関数
   * @memberof QuickAccessController
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
   * @memberof QuickAccessController
   */
  private notify = (): void => {
    this.host.requestUpdate();
    this.listeners.forEach((listener) => listener());
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
    this.host.addController(this);
    this.repository = repository;
    this.initialized = this.loadState();
  }

  /**
   * データベースから状態を再読み込みし、コンポーネントおよび全購読者へ通知する。
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  private loadState = async (): Promise<void> => {
    const record = await this.repository.getQuickAccess();
    this._state = { ...record };
    this.notify();
  };

  /**
   * データベースから最新の状態を再読み込みする。
   *
   * @return {*}  {Promise<void>}
   * @memberof QuickAccessController
   */
  public refresh = async (): Promise<void> => {
    await this.loadState();
  };

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
