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
   * 指定したIDのラベルの選択状態を排他的にトグルする。
   * 対象ラベルが非選択だった場合、対象ラベルのみを選択状態にし、他のラベルは解除する。
   * 対象ラベルが選択中だった場合、選択状態を解除する。
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

    const nextSelected = !label.isSelected;
    await db.transaction("rw", this.table, async () => {
      await this.table.toCollection().modify({ isSelected: false });
      if (nextSelected) {
        await this.table.update(id, { isSelected: true });
      }
    });
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
