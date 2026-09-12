import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { LabelsRepository } from "@/repositories/labels.repository";
import type { LabelRecord } from "@/db/models/navigation.model";

/**
 * Label関連イベントを管理する Reactive Controller
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
   * データベースから状態を再読み込みし、コンポーネントを再描画する。
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof LabelsController
   */
  private loadState = async (): Promise<void> => {
    const record = await this.repository.getAll();
    this._state = [...record];
    this.host.requestUpdate();
  };

  /**
   * 新規ラベルを作成する
   *
   * @param {Omit<LabelRecord, "id" | "isSelected">} data
   * @memberof LabelsController
   */
  public createLabel = async (
    data: Omit<LabelRecord, "id" | "isSelected">,
  ): Promise<void> => {
    await this.repository.add({
      ...data,
      isSelected: false,
    });
    await this.loadState();
  };

  /**
   * ラベル内容を更新する
   *
   * @param {number} id
   * @param {Partial<Omit<LabelRecord, "id">>} data
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
   * @memberof LabelsController
   */
  public toggleLabel = async (id: number): Promise<void> => {
    await this.repository.toggleLabel(id);
    await this.loadState();
  };

  /**
   * 全ての選択状態を解除する
   *
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
    return this.selectedLabelIds.length > 0;
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
