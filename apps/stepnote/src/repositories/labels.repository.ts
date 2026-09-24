import { db } from "@/db/schema/database.schema";
import type { LabelRecord } from "@/db/models/navigation.model";
import { BaseRepository } from "./base.repository";

/**
 * Labelに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class LabelsRepository
 * @extends {BaseRepository<LabelRecord>}
 */
export class LabelsRepository extends BaseRepository<LabelRecord> {
  constructor() {
    super(db.labels);
  }

  /**
   * 指定したIDのラベルの選択状態を反転させる。
   *
   * @param {number} id
   * @return {*} {Promise<void>}
   * @memberof LabelsRepository
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
   * @return {*} {Promise<void>}
   * @memberof LabelsRepository
   */
  public clearAllSelected = async (): Promise<void> => {
    await this.table.toCollection().modify({ isSelected: false });
  };
}
