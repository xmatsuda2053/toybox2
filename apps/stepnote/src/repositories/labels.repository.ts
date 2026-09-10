import { db } from "@/db/schema/database.schema";
import { LabelRecord } from "@/db/models/navigation.model";

/**
 * Labelに対するCRUDを制御する
 *
 * @export
 * @class LabelRepository
 */
export class LabelsRepository {
  /**
   * DBからすべてのラベルを取得する
   *
   * @return {*}
   * @memberof LabelRepository
   */
  public getAll = async (): Promise<LabelRecord[]> => {
    return await db.labels.toArray();
  };

  /**
   * 指定したIDのラベルを取得する
   *
   * @param {number} id
   * @return {*}  {Promise<LabelRecord | undefined>}
   * @memberof LabelRepository
   */
  public getById = async (id: number): Promise<LabelRecord | undefined> => {
    return await db.labels.get(id);
  };

  /**
   * 新規ラベルを追加する
   *
   * @param {Omit<LabelRecord, "id">} label
   * @memberof LabelRepository
   */
  public add = async (label: Omit<LabelRecord, "id">): Promise<number> => {
    return await db.labels.add({ ...label });
  };

  /**
   * 指定したIDのラベルを更新する
   *
   * @param {number} id
   * @param {Partial<Omit<LabelRecord, "id">>} partial
   * @memberof LabelRepository
   */
  public update = async (
    id: number,
    partial: Partial<Omit<LabelRecord, "id">>,
  ): Promise<void> => {
    await db.labels.update(id, partial);
  };

  /**
   * 指定したIDのラベルを削除する
   *
   * @param {number} id
   * @memberof LabelRepository
   */
  public delete = async (id: number): Promise<void> => {
    await db.labels.delete(id);
  };

  /**
   * 指定したIDのラベルの選択状態を反転させる。
   *
   * @param {number} id
   * @memberof LabelRepository
   */
  public toggleLabel = async (id: number): Promise<void> => {
    const label: LabelRecord | undefined = await this.getById(id);
    if (!label) {
      throw new Error(`Label with id ${id} not found`);
    }
    await this.update(id, { isSelected: !label.isSelected });
  };

  /**
   * すべてのラベルの選択状態を解除する。
   *
   * @memberof LabelRepository
   */
  public clearAllSelected = async (): Promise<void> => {
    await db.labels.toCollection().modify({ isSelected: false });
  };
}
