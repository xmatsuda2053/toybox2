import type { ReactiveControllerHost } from "lit";
import type { LabelsRepository } from "@/repositories/labels.repository";
import type { LabelRecord } from "@/db/models/navigation.model";
import { BaseDataController } from "./base-reactive.controller";

/**
 * Label関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class LabelsController
 * @extends {BaseDataController}
 */
export class LabelsController extends BaseDataController<
  LabelsRepository,
  readonly LabelRecord[]
> {
  constructor(host: ReactiveControllerHost, repository: LabelsRepository) {
    super(host, repository, []);
  }

  /**
   * 登録済みラベル全件をDBから再取得し、変更を全購読者へ通知する。
   */
  protected async loadState(): Promise<void> {
    this._state = [...(await this.repository.getAll())];
    this.notify();
  }

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
