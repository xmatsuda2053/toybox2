import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { LabelsRepository } from "@/repositories/labels.repository";
import type { LabelRecord } from "@/db/models/navigation.model";

/**
 * Label関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class LabelsController
 * @implements {ReactiveController}
 */
export class LabelsController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: LabelsRepository;

  /** Labelsの内部状態 */
  private _state: LabelRecord[] = [];

  /**
   * 現在のラベル一覧（読み取り専用）
   *
   * @readonly
   * @type {readonly LabelRecord[]}
   * @memberof LabelsController
   */
  public get state(): readonly LabelRecord[] {
    return this._state;
  }

  /**
   * Controllerの非同期初期化状態。
   *
   * このプロパティの解決（then）されたタイミングで、本コントローラーの内部状態が完全に
   * 初期化されたことを保証する。
   *
   * @type {Promise<void>}
   * @memberof LabelsController
   */
  public readonly initialized: Promise<void>;

  /**
   * Creates an instance of LabelsController.
   * @param {ReactiveControllerHost} host
   * @param {LabelsRepository} repository
   * @memberof LabelsController
   */
  constructor(host: ReactiveControllerHost, repository: LabelsRepository) {
    this.host = host;
    this.host.addController(this);
    this.repository = repository;
    this.initialized = this.loadState();
  }

  /**
   * 状態変更を購読するリスナー関数のセット
   *
   * @private
   * @type {Set<() => void>}
   * @memberof LabelsController
   */
  private listeners: Set<() => void> = new Set();

  /**
   * 状態変更リスナーを登録する（Observer / Subscribe パターン）。
   *
   * 状態が変更（DB更新完了）された際に呼び出されるコールバック関数を登録します。
   * 戻り値として、登録したリスナーを安全に解除するための購読解除関数（Unsubscribe）を返却します。
   *
   * @param {() => void} listener 状態変更時に実行するコールバック関数
   * @return {() => void} 購読を解除するための関数
   * @memberof LabelsController
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
   * @memberof LabelsController
   */
  private notify = (): void => {
    this.host.requestUpdate();
    this.listeners.forEach((listener) => listener());
  };

  /**
   * データベースから状態を再読み込みし、コンポーネントおよび全購読者へ通知する。
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof LabelsController
   */
  private loadState = async (): Promise<void> => {
    const record = await this.repository.getAll();
    this._state = [...record];
    this.notify();
  };

  /**
   * データベースから最新の状態を再読み込みする。
   *
   * @return {*}  {Promise<void>}
   * @memberof LabelsController
   */
  public refresh = async (): Promise<void> => {
    await this.loadState();
  };

  /**
   * 新規ラベルを作成する
   *
   * @param {Omit<LabelRecord, "id" | "isSelected">} data
   * @return {*}  {Promise<number>} 採番されたラベルID
   * @memberof LabelsController
   */
  public createLabel = async (
    data: Omit<LabelRecord, "id" | "isSelected">,
  ): Promise<number> => {
    const newId = await this.repository.add({
      ...data,
      isSelected: false,
    });
    await this.loadState();
    return newId;
  };

  /**
   * ラベル内容を更新する
   *
   * @param {number} id
   * @param {Partial<Omit<LabelRecord, "id">>} data
   * @return {*}  {Promise<void>}
   * @memberof LabelsController
   */
  public updateLabel = async (
    id: number,
    data: Partial<Omit<LabelRecord, "id">>,
  ): Promise<void> => {
    await this.repository.update(id, data);
    await this.loadState();
  };

  /**
   * 指定したIDのラベルを削除する
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof LabelsController
   */
  public deleteLabel = async (id: number): Promise<void> => {
    await this.repository.delete(id);
    await this.loadState();
  };

  /**
   * 指定したIDの選択状態をON/OFFする
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof LabelsController
   */
  public toggleLabel = async (id: number): Promise<void> => {
    await this.repository.toggleLabel(id);
    await this.loadState();
  };

  /**
   * 全ての選択状態を解除する
   *
   * @return {*}  {Promise<void>}
   * @memberof LabelsController
   */
  public clearAllSelected = async (): Promise<void> => {
    await this.repository.clearAllSelected();
    await this.loadState();
  };

  /**
   * 現在選択中のラベルIDの配列を取得する
   *
   * @returns {number[]}
   * @readonly
   * @memberof LabelsController
   */
  public get selectedLabelIds(): number[] {
    return this._state
      .filter(
        (label): label is LabelRecord & { id: number } =>
          label.isSelected && label.id !== undefined,
      )
      .map((label) => label.id);
  }

  /**
   * 選択中のラベルが存在するか判定する
   *
   * @returns {boolean}
   * @readonly
   * @memberof LabelsController
   */
  public get hasSelectedLabels(): boolean {
    return this._state.some((label) => label.isSelected);
  }

  /**
   * hostConnected
   *
   * @memberof LabelsController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof LabelsController
   */
  hostDisconnected(): void {}
}
